document.addEventListener('DOMContentLoaded', () => {
    const settleForm = document.getElementById('settleShipmentForm');
    const messageDiv = document.getElementById('message');
    const finalAmountInput = document.getElementById('finalAmount');
    const orderIdInput = document.getElementById('orderId');
    const barcodeButton = document.getElementById('barcodeScanner');
    const qrButton = document.getElementById('qrScanner');
    const videoElement = document.getElementById('scannerVideo');
    const printLabelButton = document.getElementById('printLabel'); // Print button for label

    // Request camera permission only when needed
    const requestCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            return stream;
        } catch (error) {
            console.error('Camera access denied:', error);
            messageDiv.textContent = 'Camera access denied. Please enable camera access to scan barcodes or QR codes.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
        }
    };

    // Stop the camera stream after use
    const stopCameraStream = (stream) => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    };

    // Function to fetch order details with proper error handling
    const fetchOrderDetails = async (orderId) => {
        try {
            const response = await fetch(`https://group8-a70f0e413328.herokuapp.com/api/orders/${orderId}`);
            if (!response.ok) {
                throw new Error('Order not found');
            }
            const order = await response.json();
            return order;
        } catch (error) {
            console.error('Error fetching order details:', error);
            throw new Error('Unable to find order number. Please check that the number is correct or try again.');
        }
    };

    // Handle form submission for settling the shipment
    settleForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const enteredOrderId = orderIdInput.value.trim();
        if (!/^\d{6}$/.test(enteredOrderId)) {
            messageDiv.textContent = 'You must enter a 6-digit number for the Order ID.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return;
        }

        const fullOrderId = `WP-${enteredOrderId}`;
        const finalAmount = parseFloat(finalAmountInput.value.replace(/[^0-9.-]+/g, ""));

        if (isNaN(finalAmount)) {
            messageDiv.textContent = 'Please enter a valid final amount';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return;
        }

        try {
            const order = await fetchOrderDetails(fullOrderId);
            const authorizationAmount = order.AuthorizationAmount;

            if (finalAmount > authorizationAmount) {
                messageDiv.textContent = 'Final amount exceeds the authorized amount!';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                return;
            }

            const response = await fetch('https://group8-a70f0e413328.herokuapp.com/api/settle-shipment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: fullOrderId,
                    finalAmount: finalAmount
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                messageDiv.textContent = `Error: ${result.message}`;
                messageDiv.className = 'message error';
            } else {
                messageDiv.textContent = result.message;
                messageDiv.className = 'message success';

                // Display print button and enable printing label
                printLabelButton.style.display = 'inline-block';
            }
        } catch (error) {
            messageDiv.textContent = error.message;
            messageDiv.className = 'message error';
        }

        messageDiv.style.display = 'block';
    });

    // Automatically format finalAmount input when the user finishes typing (on blur)
    finalAmountInput.addEventListener('blur', (event) => {
        let inputVal = event.target.value;
        inputVal = inputVal.replace(/[^0-9.]/g, '');

        if (inputVal) {
            const formattedValue = parseFloat(inputVal).toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            });
            event.target.value = formattedValue;
        }
    });

    // Ensure only numeric input is allowed (and one decimal point) while typing
    finalAmountInput.addEventListener('input', (event) => {
        let inputVal = event.target.value;
        inputVal = inputVal.replace(/[^0-9.]/g, '');

        if ((inputVal.match(/\./g) || []).length > 1) {
            inputVal = inputVal.substring(0, inputVal.lastIndexOf("."));
        }

        event.target.value = inputVal;
    });

    // Function to start barcode scanning
    const startBarcodeScanner = async () => {
        const stream = await requestCameraPermission();
        if (!stream) return;

        videoElement.style.display = 'block'; // Show video stream
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: videoElement, // Video element to display the camera stream
            },
            decoder: {
                readers: ["code_128_reader", "ean_reader"] // Supported barcode types
            }
        }, (err) => {
            if (err) {
                console.error(err);
                stopCameraStream(stream);
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected((data) => {
            const barcode = data.codeResult.code;
            orderIdInput.value = barcode; // Set the scanned barcode as the orderId
            Quagga.stop();
            stopCameraStream(stream);
            videoElement.style.display = 'none'; // Hide video stream
        });
    };

    // Function to start QR code scanning
    const startQRScanner = async () => {
        const stream = await requestCameraPermission();
        if (!stream) return;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        videoElement.style.display = 'block'; // Show video stream

        videoElement.srcObject = stream;
        videoElement.play();

        const scanQRCode = () => {
            if (videoElement.readyState === videoElement.HAVE_ENOUGH_DATA) {
                canvas.width = videoElement.videoWidth;
                canvas.height = videoElement.videoHeight;
                context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                const qrCode = jsQR(imageData.data, canvas.width, canvas.height);
                if (qrCode) {
                    orderIdInput.value = qrCode.data; // Set the scanned QR code as the orderId
                    stopCameraStream(stream);
                    videoElement.style.display = 'none'; // Hide video stream
                } else {
                    requestAnimationFrame(scanQRCode);
                }
            }
        };
        requestAnimationFrame(scanQRCode);
    };

    // Event listeners for barcode and QR code scanners
    barcodeButton.addEventListener('click', startBarcodeScanner);
    qrButton.addEventListener('click', startQRScanner);

    // Function to print the shipment label
    const printLabel = () => {
        const orderId = orderIdInput.value.trim();
        const labelWindow = window.open('', '', 'height=400,width=600');
        labelWindow.document.write('<html><head><title>Shipment Label</title>');
        labelWindow.document.write('</head><body>');
        labelWindow.document.write(`<h1>Shipment Label for Order: WP-${orderId}</h1>`);
        labelWindow.document.write('<p>Shipping Address: <strong>John Doe, 123 Main St, City, State, ZIP</strong></p>');
        labelWindow.document.write('<p>Warehouse Status: Ready for Shipment</p>');
        labelWindow.document.write('</body></html>');
        labelWindow.document.close();
        labelWindow.print();
    };
});


const generatePDFLabel = (orderId, shippingAddress) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Shipment Label', 10, 10);
    doc.setFontSize(12);
    doc.text(`Order ID: WP-${orderId}`, 10, 20);
    doc.text(`Shipping Address: ${shippingAddress}`, 10, 30);
    doc.text('Warehouse Status: Ready for Shipment', 10, 40);

    doc.save(`Shipment_Label_WP-${orderId}.pdf`);
};


const fetchOrderHistory = async () => {
    try {
        const response = await fetch('https://group8-a70f0e413328.herokuapp.com/api/orders/settled'); // Replace with your endpoint
        const orders = await response.json();
        const orderHistoryTableBody = document.getElementById('orderHistoryTableBody');
        orderHistoryTableBody.innerHTML = ''; // Clear previous entries

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>WP-${order.OrderID}</td>
                <td>${new Date(order.WarehouseApprovalDate).toLocaleString()}</td>
                <td>${order.WarehouseStatus}</td>
                <td><a href="${order.TrackingLink}" target="_blank">Track Shipment</a></td>
            `;
            orderHistoryTableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error fetching order history:', error);
    }
};

// Call this function when loading the order history section
fetchOrderHistory();

const createShipment = async (orderDetails) => {
    const shipmentData = {
        address_from: {
            name: "Warehouse",
            street1: "123 Warehouse St",
            city: "City",
            state: "State",
            zip: "ZIP",
            country: "US"
        },
        address_to: orderDetails.shippingAddress, // Use customer shipping address from order
        parcels: [
            {
                length: "10",
                width: "7",
                height: "5",
                distance_unit: "in",
                weight: "2",
                mass_unit: "lb"
            }
        ],
        servicelevel_token: "usps_priority",
    };

    const response = await fetch('https://api.goshippo.com/shipments', {
        method: 'POST',
        headers: {
            'Authorization': 'ShippoToken YOUR_SHIPPO_TOKEN',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentData)
    });

    const shipment = await response.json();
    const shippingLabelUrl = shipment.object_label_url;
    
    return shippingLabelUrl;
};


const nodemailer = require('nodemailer');

const sendEmailConfirmation = async (customerEmail, orderDetails, trackingLink) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'youremail@gmail.com',
            pass: 'yourpassword'
        }
    });

    const mailOptions = {
        from: 'youremail@gmail.com',
        to: customerEmail,
        subject: `Order ${orderDetails.OrderID} Confirmation`,
        text: `Your order has been settled. You can track it here: ${trackingLink}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

// Polling example for real-time updates
setInterval(async () => {
    const response = await fetch('https://group8-a70f0e413328.herokuapp.com/api/orders/status');
    const updatedStatus = await response.json();
    document.getElementById('warehouseStatus').innerText = updatedStatus.WarehouseStatus;
}, 10000); // Poll every 10 seconds

const updateWarehouseStatus = async (orderId, status) => {
    const response = await fetch(`https://group8-a70f0e413328.herokuapp.com/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            WarehouseStatus: status,
            WarehouseApprovalDate: new Date() // Add current date and time
        })
    });

    const result = await response.json();
    return result;
};
