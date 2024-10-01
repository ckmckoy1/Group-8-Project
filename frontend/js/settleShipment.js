document.addEventListener('DOMContentLoaded', () => {
    const settleForm = document.getElementById('settleShipmentForm');
    const messageDiv = document.getElementById('message');
    const finalAmountInput = document.getElementById('finalAmount');
    const orderIdInput = document.getElementById('orderId'); // The input field for order number
    const barcodeButton = document.getElementById('barcodeScanner');
    const qrButton = document.getElementById('qrScanner');
    const videoElement = document.getElementById('scannerVideo');

    // Function to fetch order details
    const fetchOrderDetails = async (orderId) => {
        try {
            const response = await fetch(`https://group8-a70f0e413328.herokuapp.com/api/orders/${orderId}`); // Full URL for Heroku
            if (!response.ok) {
                throw new Error('Order not found');
            }
            const order = await response.json();
            return order;
        } catch (error) {
            console.error('Error fetching order details:', error);
            throw error;
        }
    };

    // Handle form submission for settling the shipment
    settleForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Retrieve the entered order number and verify its length
        const enteredOrderId = orderIdInput.value.trim();

        // Ensure the orderId is exactly 6 digits long
        if (!/^\d{6}$/.test(enteredOrderId)) {
            messageDiv.textContent = 'Order ID must be exactly 6 digits long!';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return;
        }

        // Prepend "WP-" to the order number for MongoDB lookup
        const fullOrderId = `WP-${enteredOrderId}`;

        // Convert the finalAmount to a float by stripping out non-numeric characters
        const finalAmount = parseFloat(finalAmountInput.value.replace(/[^0-9.-]+/g, ""));

        if (isNaN(finalAmount)) {
            messageDiv.textContent = 'Please enter a valid final amount';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return;
        }

        try {
            // Fetch the order details from the backend
            const order = await fetchOrderDetails(fullOrderId);

            const authorizationAmount = order.AuthorizationAmount; // Ensure capitalization matches MongoDB schema

            if (finalAmount > authorizationAmount) {
                messageDiv.textContent = 'Final amount exceeds authorized amount!';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                return;
            }

            // Send settlement request to the backend
            const response = await fetch('https://group8-a70f0e413328.herokuapp.com/api/settle-shipment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: fullOrderId, // Send the full orderId with the WP- prefix
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
            }
        } catch (error) {
            console.error('Error during shipment settlement:', error);
            messageDiv.textContent = 'Error: Something went wrong!';
            messageDiv.className = 'message error';
        }

        messageDiv.style.display = 'block';
    });

    // Automatically format finalAmount input when the user finishes typing (on blur)
    finalAmountInput.addEventListener('blur', (event) => {
        let inputVal = event.target.value;

        // Remove any non-numeric characters except for digits and decimal point
        inputVal = inputVal.replace(/[^0-9.]/g, '');

        // Convert to a float and format as a number with two decimal places
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

        // Remove any non-numeric characters except for digits and the decimal point
        inputVal = inputVal.replace(/[^0-9.]/g, '');

        // Ensure only one decimal point is allowed
        if ((inputVal.match(/\./g) || []).length > 1) {
            inputVal = inputVal.substring(0, inputVal.lastIndexOf("."));
        }

        event.target.value = inputVal;
    });

    // Function to start barcode scanning
    const startBarcodeScanner = () => {
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
                return;
            }
            Quagga.start();
        });

        Quagga.onDetected((data) => {
            const barcode = data.codeResult.code;
            orderIdInput.value = barcode; // Set the scanned barcode as the orderId
            Quagga.stop();
            videoElement.style.display = 'none'; // Hide video stream
        });
    };

    // Function to start QR code scanning
    const startQRScanner = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        videoElement.style.display = 'block'; // Show video stream

        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then((stream) => {
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
                        videoElement.srcObject.getTracks().forEach(track => track.stop()); // Stop the video stream
                        videoElement.style.display = 'none'; // Hide video stream
                    } else {
                        requestAnimationFrame(scanQRCode);
                    }
                }
            };
            requestAnimationFrame(scanQRCode);
        });
    };

    // Add event listeners for scanning buttons
    barcodeButton.addEventListener('click', startBarcodeScanner);
    qrButton.addEventListener('click', startQRScanner);
});
