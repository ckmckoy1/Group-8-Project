document.addEventListener('DOMContentLoaded', () => {
    const settleForm = document.getElementById('settleShipmentForm');
    const messageDiv = document.getElementById('message');
    const finalAmountInput = document.getElementById('finalAmount');
    const orderIdInput = document.getElementById('orderId');
    const barcodeButton = document.getElementById('barcodeScanner');
    const qrReaderContainer = document.getElementById('qr-reader');
    const printLabelButton = document.getElementById('printLabel'); // Print button for label
    const loadingSpinner = document.getElementById('loadingSpinner');
    const scannerInstructions = document.getElementById('scannerInstructions');

    const orderHistoryContainer = document.querySelector('.order-history-container');
    const warehouseStatusContainer = document.querySelector('.warehouse-status-container');
    const orderHistoryTableBody = document.getElementById('orderHistoryTableBody');
    const warehouseStatusElement = document.getElementById('warehouseStatus');

    let html5QrCode = null;

    // Function to fetch order details with proper error handling
    const fetchOrderDetails = async (orderId) => {
        console.log(`Fetching details for Order ID: ${orderId}`);
        try {
            const response = await fetch(`https://group8-a70f0e413328.herokuapp.com/api/orders/${orderId}`);
            if (!response.ok) {
                throw new Error('Order not found');
            }
            const order = await response.json();
            console.log('Order details fetched:', order);
            return order;
        } catch (error) {
            console.error('Error fetching order details:', error);
            throw new Error('Unable to find order number. Please check that the number is correct or try again.');
        }
    };

    // Function to fetch order history for a specific order
    const fetchSpecificOrderHistory = async (orderId) => {
        console.log(`Fetching order history for Order ID: ${orderId}`);
        try {
            const response = await fetch(`https://group8-a70f0e413328.herokuapp.com/api/orders/${orderId}/history`);
            if (!response.ok) {
                throw new Error('Failed to fetch order history.');
            }
            const history = await response.json();
            console.log('Order history fetched:', history);
            return history;
        } catch (error) {
            console.error('Error fetching order history:', error);
            throw new Error('Unable to fetch order history.');
        }
    };

    // Function to fetch warehouse status for a specific order
    const fetchWarehouseStatus = async (orderId) => {
        console.log(`Fetching warehouse status for Order ID: ${orderId}`);
        try {
            const response = await fetch(`https://group8-a70f0e413328.herokuapp.com/api/orders/${orderId}/status`);
            if (!response.ok) {
                throw new Error('Failed to fetch warehouse status.');
            }
            const status = await response.json();
            console.log('Warehouse status fetched:', status);
            return status;
        } catch (error) {
            console.error('Error fetching warehouse status:', error);
            throw new Error('Unable to fetch warehouse status.');
        }
    };

    // Handle form submission for settling the shipment
    settleForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        console.log('Form submission started.');

        let enteredOrderId = orderIdInput.value.trim();
        console.log(`Entered Order ID: ${enteredOrderId}`);

        // Check if the enteredOrderId already includes the prefix
        if (!enteredOrderId.startsWith('WP-')) {
            // Validate that the order ID is a 6-digit number
            const orderIdNumber = enteredOrderId;
            if (!/^\d{6}$/.test(orderIdNumber)) {
                messageDiv.textContent = 'You must enter a 6-digit number for the Order ID.';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                console.log('Order ID validation failed: Not a 6-digit number.');
                return;
            }
            enteredOrderId = `WP-${orderIdNumber}`;
            console.log(`Order ID prefixed: ${enteredOrderId}`);
        } else {
            // Validate that after 'WP-' there are exactly 6 digits
            const orderIdNumber = enteredOrderId.slice(3);
            if (!/^\d{6}$/.test(orderIdNumber)) {
                messageDiv.textContent = 'You must enter a 6-digit number for the Order ID after WP-.';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                console.log('Order ID validation failed: Not a 6-digit number after WP-.');
                return;
            }
        }

        const finalAmount = parseFloat(finalAmountInput.value.replace(/[^0-9.-]+/g, ""));
        console.log(`Final Amount Entered: ${finalAmount}`);

        if (isNaN(finalAmount)) {
            messageDiv.textContent = 'Please enter a valid final amount';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            console.log('Final amount validation failed: NaN.');
            return;
        }

        try {
            const order = await fetchOrderDetails(enteredOrderId);
            const authorizationAmount = order.AuthorizationAmount;
            console.log(`Authorization Amount: ${authorizationAmount}`);

            if (finalAmount > authorizationAmount) {
                messageDiv.textContent = 'Final amount exceeds the authorized amount!';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                console.log('Final amount exceeds authorization amount.');
                return;
            }

            // Post request to settle shipment
            console.log('Sending settlement request.');
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
            console.log('Settlement response:', result);

            if (!response.ok) {
                messageDiv.textContent = `Error: ${result.message}`;
                messageDiv.className = 'message error';
                console.log('Settlement failed.');
            } else {
                messageDiv.textContent = result.message;
                messageDiv.className = 'message success';
                console.log('Settlement successful.');

                // Display print button and enable printing label
                printLabelButton.style.display = 'inline-block';
            }

            messageDiv.style.display = 'block';

            // Fetch and display Order History and Warehouse Status
            await displayOrderRelatedInfo(enteredOrderId);

        } catch (error) {
            messageDiv.textContent = error.message;
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            console.error('Error during form submission:', error);
        }
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
            console.log(`Final amount formatted: ${formattedValue}`);
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
        console.log(`Final amount input sanitized: ${inputVal}`);
    });

    // Function to start QR code scanner using Html5Qrcode
    const startQrScanner = () => {
        console.log('Starting QR scanner.');
        loadingSpinner.style.display = 'flex'; // Show loading spinner
        scannerInstructions.style.display = 'block'; // Show instructions
        messageDiv.textContent = 'Initializing camera...';
        messageDiv.className = 'message';
        messageDiv.style.display = 'block';
        qrReaderContainer.style.display = 'block'; // Show scanner container

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        html5QrCode = new Html5Qrcode("qr-reader");

        const qrCodeSuccessCallback = (decodedText, decodedResult) => {
            // Handle the decoded text
            console.log(`Code matched = ${decodedText}`, decodedResult);
            html5QrCode.stop().then(ignore => {
                qrReaderContainer.style.display = 'none'; // Hide scanner container
                loadingSpinner.style.display = 'none';
                scannerInstructions.style.display = 'none';
                messageDiv.textContent = 'Barcode scanned successfully.';
                messageDiv.className = 'message success';
                messageDiv.style.display = 'block';
                orderIdInput.value = decodedText.startsWith('WP-') ? decodedText.slice(3) : decodedText;
                console.log(`Order ID set to: ${orderIdInput.value}`);
                // Fetch and display Order History and Warehouse Status
                displayOrderRelatedInfo(`WP-${orderIdInput.value.trim().replace(/^WP-/, '')}`);
            }).catch(err => {
                console.error('Error stopping scanner:', err);
                messageDiv.textContent = 'Error stopping scanner.';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
            });
        };

        const qrCodeErrorCallback = (errorMessage) => {
            // Optional: Handle scan errors or ignore
            console.warn(`QR Code no match: ${errorMessage}`);
        };

        Html5Qrcode.getCameras().then(cameras => {
            if (cameras && cameras.length) {
                const cameraId = cameras[0].id; // Use the first available camera
                console.log(`Using camera: ${cameraId}`);
                html5QrCode.start(
                    cameraId,
                    config,
                    qrCodeSuccessCallback,
                    qrCodeErrorCallback
                ).then(() => {
                    loadingSpinner.style.display = 'none';
                    messageDiv.style.display = 'none';
                    console.log('Scanner started successfully.');
                }).catch(err => {
                    console.error('Unable to start scanning:', err);
                    messageDiv.textContent = 'Unable to start scanning.';
                    messageDiv.className = 'message error';
                    messageDiv.style.display = 'block';
                    qrReaderContainer.style.display = 'none';
                });
            } else {
                console.error('No cameras found on device.');
                messageDiv.textContent = 'No cameras found on device.';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
            }
        }).catch(err => {
            console.error('Error accessing cameras:', err);
            messageDiv.textContent = 'Error accessing cameras.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            qrReaderContainer.style.display = 'none';
        });
    };

    // Event listener for barcode scanner
    barcodeButton.addEventListener('click', startQrScanner);

    // Function to print the shipment label
    const printLabel = async () => {
        const orderId = orderIdInput.value.trim();
        console.log(`Printing label for Order ID: ${orderId}`);
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
            console.log('Label printed successfully.');
        } catch (error) {
            console.error('Error printing label:', error);
            messageDiv.textContent = 'Error printing label. Please try again.';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
        }
    };

    // Attach the printLabel function to the print button
    printLabelButton.addEventListener('click', printLabel);

    // Function to display Order History and Warehouse Status
    const displayOrderRelatedInfo = async (orderId) => {
        try {
            console.log(`Displaying order-related info for Order ID: ${orderId}`);
            // Fetch and display Order History
            const history = await fetchSpecificOrderHistory(orderId);
            orderHistoryTableBody.innerHTML = ''; // Clear previous entries
            console.log('Populating order history table.');

            history.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>WP-${order.OrderID}</td>
                    <td>${new Date(order.WarehouseApprovalDate).toLocaleString()}</td>
                    <td>${order.WarehouseStatus}</td>
                    <td><a href="${order.TrackingLink}" target="_blank">Track Shipment</a></td>
                `;
                orderHistoryTableBody.appendChild(row);
            });

            orderHistoryContainer.style.display = 'block'; // Show Order History section
            console.log('Order history displayed.');

            // Fetch and display Warehouse Status
            const status = await fetchWarehouseStatus(orderId);
            warehouseStatusElement.innerText = status.WarehouseStatus;
            warehouseStatusContainer.style.display = 'block'; // Show Warehouse Status section
            console.log('Warehouse status displayed.');
        } catch (error) {
            console.error('Error displaying order related info:', error);
            messageDiv.textContent = error.message;
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
        }
    };
});
