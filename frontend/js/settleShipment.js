document.addEventListener('DOMContentLoaded', () => {
    const settleForm = document.getElementById('settleShipmentForm');
    const messageDiv = document.getElementById('message');
    const finalAmountInput = document.getElementById('finalAmount');
    const orderIdInput = document.getElementById('orderId');
    const barcodeButton = document.getElementById('barcodeScanner');
    const videoElement = document.getElementById('scannerVideo');
    const printLabelButton = document.getElementById('printLabel'); // Print button for label
    const loadingSpinner = document.getElementById('loadingSpinner');
    const scannerInstructions = document.getElementById('scannerInstructions');

    // Request camera permission only when needed
    const requestCameraPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            return stream;
        } catch (error) {
            console.error('Camera access denied:', error);
            messageDiv.textContent = 'Camera access denied. Please enable camera access to scan barcodes.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return null;
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

        let enteredOrderId = orderIdInput.value.trim();

        // Check if the enteredOrderId already includes the prefix
        if (!enteredOrderId.startsWith('WP-')) {
            // Validate that the order ID is a 6-digit number
            const orderIdNumber = enteredOrderId;
            if (!/^\d{6}$/.test(orderIdNumber)) {
                messageDiv.textContent = 'You must enter a 6-digit number for the Order ID.';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                return;
            }
            enteredOrderId = `WP-${orderIdNumber}`;
        } else {
            // Validate that after 'WP-' there are exactly 6 digits
            const orderIdNumber = enteredOrderId.slice(3);
            if (!/^\d{6}$/.test(orderIdNumber)) {
                messageDiv.textContent = 'You must enter a 6-digit number for the Order ID after WP-.';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                return;
            }
        }

        const finalAmount = parseFloat(finalAmountInput.value.replace(/[^0-9.-]+/g, ""));

        if (isNaN(finalAmount)) {
            messageDiv.textContent = 'Please enter a valid final amount';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return;
        }

        try {
            const order = await fetchOrderDetails(enteredOrderId);
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
                    orderId: enteredOrderId,
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
        loadingSpinner.style.display = 'flex'; // Show loading spinner
        scannerInstructions.style.display = 'block'; // Show instructions
        const stream = await requestCameraPermission();
        if (!stream) {
            loadingSpinner.style.display = 'none'; // Hide loading spinner
            scannerInstructions.style.display = 'none'; // Hide instructions
            return;
        }

        videoElement.style.display = 'block'; // Show video stream
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: videoElement, // Video element to display the camera stream
                constraints: {
                    facingMode: "environment" // Prefer the back camera
                }
            },
            decoder: {
                readers: ["code_128_reader", "ean_reader"] // Supported barcode types
            },
            locate: true, // Enable localization of barcode in the image
        }, (err) => {
            loadingSpinner.style.display = 'none'; // Hide loading spinner
            if (err) {
                console.error(err);
                stopCameraStream(stream);
                messageDiv.textContent = 'Error initializing barcode scanner.';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                scannerInstructions.style.display = 'none'; // Hide instructions
                return;
            }
            Quagga.start();
        });

        Quagga.onProcessed((result) => {
            const drawingCtx = Quagga.canvas.ctx.overlay,
                  drawingCanvas = Quagga.canvas.dom.overlay;

            if (result) {
                if (result.boxes) {
                    drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                    result.boxes.filter(box => box !== result.box).forEach(box => {
                        Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: 'green', lineWidth: 2});
                    });
                }

                if (result.box) {
                    Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: '#00F', lineWidth: 2});
                }

                if (result.codeResult && result.codeResult.code) {
                    Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: 'red', lineWidth: 3});
                }
            }
        });

        Quagga.onDetected((data) => {
            const barcode = data.codeResult.code;
            // Check if barcode already has the prefix
            if (!barcode.startsWith('WP-')) {
                orderIdInput.value = barcode;
            } else {
                orderIdInput.value = barcode.slice(3); // Remove 'WP-' prefix for consistency
            }
            Quagga.stop();
            stopCameraStream(stream);
            videoElement.style.display = 'none'; // Hide video stream
            scannerInstructions.style.display = 'none'; // Hide instructions
            messageDiv.textContent = 'Barcode scanned successfully.';
            messageDiv.className = 'message success';
            messageDiv.style.display = 'block';
        });
    };

    // Event listener for barcode scanner
    barcodeButton.addEventListener('click', startBarcodeScanner);

    // Function to print the shipment label
    const printLabel = async () => {
        const orderId = orderIdInput.value.trim();
        try {
            const order = await fetchOrderDetails(orderId);
            const shippingAddress = order.ShippingAddress; // Assuming the API returns this field

            const labelWindow = window.open('', '', 'height=600,width=800');
            labelWindow.document.write('<html><head><title>Shipment Label</title>');
            labelWindow.document.write('<style>');
            labelWindow.document.write('body { font-family: Arial, sans-serif; padding: 20px; }');
            labelWindow.document.write('</style>');
            labelWindow.document.write('</head><body>');
            labelWindow.document.write(`<h1>Shipment Label for Order: ${orderId}</h1>`);
            labelWindow.document.write(`<p><strong>Shipping Address:</strong> ${shippingAddress.name}, ${shippingAddress.street1}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.zip}</p>`);
            labelWindow.document.write('<p><strong>Warehouse Status:</strong> Ready for Shipment</p>');
            labelWindow.document.write('</body></html>');
            labelWindow.document.close();
            labelWindow.focus();
            labelWindow.print();
            labelWindow.close();
        } catch (error) {
            console.error('Error printing label:', error);
            messageDiv.textContent = 'Error printing label. Please try again.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
        }
    };

    // Attach the printLabel function to the print button
    printLabelButton.addEventListener('click', printLabel);

    // Fetch and display order history
    const fetchOrderHistory = async () => {
        try {
            const response = await fetch('https://group8-a70f0e413328.herokuapp.com/api/orders/settled'); // Replace with your endpoint
            if (!response.ok) {
                throw new Error('Failed to fetch order history.');
            }
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
            const orderHistoryContainer = document.querySelector('.order-history-container');
            orderHistoryContainer.innerHTML += `<p class="message error">Error fetching order history.</p>`;
        }
    };

    // Call this function when loading the order history section
    fetchOrderHistory();

    // Polling example for real-time updates
    setInterval(async () => {
        try {
            const response = await fetch('https://group8-a70f0e413328.herokuapp.com/api/orders/status');
            if (!response.ok) {
                throw new Error('Failed to fetch updated status.');
            }
            const updatedStatus = await response.json();
            const warehouseStatusElement = document.getElementById('warehouseStatus');
            if (warehouseStatusElement) {
                warehouseStatusElement.innerText = updatedStatus.WarehouseStatus;
            }
        } catch (error) {
            console.error('Error fetching updated status:', error);
            const warehouseStatusElement = document.getElementById('warehouseStatus');
            if (warehouseStatusElement) {
                warehouseStatusElement.innerText = 'Error fetching status.';
            }
        }
    }, 10000); // Poll every 10 seconds

    // Optional: Remove or handle unused functions like createShipment and updateWarehouseStatus
});
