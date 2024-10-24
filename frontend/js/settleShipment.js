// Import necessary modules
import { Html5Qrcode } from 'html5-qrcode';

document.addEventListener('DOMContentLoaded', () => {
  // Access all DOM elements
  const modeToggle = document.getElementById('modeToggle');
  const scanContainer = document.getElementById('scanContainer');
  const typeContainer = document.getElementById('typeContainer');
  const barcodeButton = document.getElementById('barcodeScanner');
  const orderIdInput = document.getElementById('orderId');
  const orderIdError = document.getElementById('orderIdError');
  const qrReaderContainer = document.getElementById('qr-reader');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const scannerInstructions = document.getElementById('scannerInstructions');
  const messageDiv = document.getElementById('message');
  const messageStep2 = document.getElementById('messageStep2');
  const finalAmountInput = document.getElementById('finalAmount');
  const settleShipmentButton = document.getElementById('settleShipmentButton');
  const printLabelButton = document.getElementById('printLabel');
  const backToStep1Button = document.getElementById('backToStep1');
  const refreshStep1Button = document.getElementById('refreshStep1');

  const step1Container = document.getElementById('step1');
  const step2Container = document.getElementById('step2');
  const step3Container = document.getElementById('step3');

  const customerNameSpan = document.getElementById('customerName');
  const customerAddressSpan = document.getElementById('customerAddress');
  const shippingMethodSpan = document.getElementById('shippingMethod');
  const orderCostSpan = document.getElementById('orderCost');
  const orderDateSpan = document.getElementById('orderDate');

  let html5QrCode = null;

  // Initialize display states
  scanContainer.style.display = 'block';
  typeContainer.style.display = 'none';

  // Toggle between Scan and Type modes
  modeToggle.addEventListener('change', () => {
    if (modeToggle.checked) {
      // Switch to Type mode
      typeContainer.style.display = 'block';
      scanContainer.style.display = 'none';

      // Stop QR scanner if active
      if (html5QrCode && html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
        html5QrCode.stop().then(() => {
          qrReaderContainer.style.display = 'none';
          scannerInstructions.style.display = 'none';
        }).catch(err => {
          console.error('Error stopping the scanner:', err);
        });
      }
    } else {
      // Switch to Scan mode
      typeContainer.style.display = 'none';
      scanContainer.style.display = 'block';
      // Clear input field
      orderIdInput.value = '';
      orderIdError.style.display = 'none';
    }
    // Clear messages
    messageDiv.style.display = 'none';
  });

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

  // Function to proceed to Step 2 after fetching order details
  const proceedToStep2 = () => {
    step1Container.style.display = 'none';
    step2Container.style.display = 'block';
    messageDiv.style.display = 'none';
    orderIdError.style.display = 'none';
  };

  // Function to go back to Step 1
  backToStep1Button.addEventListener('click', () => {
    step2Container.style.display = 'none';
    step1Container.style.display = 'block';
    // Clear order details
    customerNameSpan.textContent = '';
    customerAddressSpan.textContent = '';
    shippingMethodSpan.textContent = '';
    orderCostSpan.textContent = '';
    orderDateSpan.textContent = '';
    finalAmountInput.value = '';
    messageStep2.style.display = 'none';
  });

  // Function to refresh Step 1
  refreshStep1Button.addEventListener('click', () => {
    orderIdInput.value = '';
    orderIdError.style.display = 'none';
    messageDiv.style.display = 'none';
  });

  // Function to display order details
  const displayOrderDetails = (order) => {
    customerNameSpan.textContent = order.CustomerName;
    customerAddressSpan.textContent = `${order.ShippingAddress.street1}, ${order.ShippingAddress.city}, ${order.ShippingAddress.state}, ${order.ShippingAddress.zip}`;
    shippingMethodSpan.textContent = order.ShippingMethod;
    orderCostSpan.textContent = order.Cost.toFixed(2);
    orderDateSpan.textContent = new Date(order.OrderDate).toLocaleDateString();
  };

  // Event listener for Order ID input (Type mode)
  orderIdInput.addEventListener('input', () => {
    // Allow only numbers
    orderIdInput.value = orderIdInput.value.replace(/\D/g, '');
    orderIdError.style.display = 'none';
  });

  // Function to validate Order ID
  const validateOrderId = (orderId) => {
    if (!/^\d+$/.test(orderId)) {
      throw new Error('Please enter a valid Order ID consisting of numbers only.');
    }
  };

  // Function to handle Order ID submission (both Scan and Type modes)
  const handleOrderIdSubmission = async (orderId) => {
    try {
      validateOrderId(orderId);
      const order = await fetchOrderDetails(orderId);
      displayOrderDetails(order);
      proceedToStep2();
    } catch (error) {
      console.error('Error:', error);
      if (modeToggle.checked) {
        // Type mode error handling
        orderIdError.textContent = error.message;
        orderIdError.style.display = 'block';
      } else {
        // Scan mode error handling
        messageDiv.textContent = error.message;
        messageDiv.className = 'message error';
        messageDiv.style.display = 'block';
      }
    }
  };

  // Handle Enter key press in Order ID input
  orderIdInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      const orderId = orderIdInput.value.trim();
      handleOrderIdSubmission(orderId);
    }
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

    console.log('Creating Html5Qrcode instance.');
    html5QrCode = new Html5Qrcode("qr-reader");

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      console.log(`Code matched = ${decodedText}`, decodedResult);
      // Stop the scanner after a successful scan
      html5QrCode.stop().then(() => {
        console.log('Scanner stopped.');
        loadingSpinner.style.display = 'none';
        messageDiv.style.display = 'none';
        qrReaderContainer.style.display = 'none';
        scannerInstructions.style.display = 'none';
      }).catch(err => {
        console.error('Error stopping the scanner:', err);
      });
      // Handle the decoded Order ID
      handleOrderIdSubmission(decodedText);
    };

    const qrCodeErrorCallback = (errorMessage) => {
      console.warn(`QR Code no match: ${errorMessage}`);
    };

    // Start scanning with the back-facing camera
    console.log('Starting scanner with back-facing camera.');
    html5QrCode.start(
      { facingMode: "environment" }, // Use the back-facing camera
      config,
      qrCodeSuccessCallback,
      qrCodeErrorCallback
    ).then(() => {
      loadingSpinner.style.display = 'none';
      messageDiv.style.display = 'none';
      console.log('Scanner started successfully with back-facing camera.');
    }).catch(err => {
      console.error('Unable to start scanning with back-facing camera:', err);
      messageDiv.textContent = 'Unable to access the back camera.';
      messageDiv.className = 'message error';
      messageDiv.style.display = 'block';
      qrReaderContainer.style.display = 'none';
      loadingSpinner.style.display = 'none';
    });
  };

  // Event listener for barcode scanner button
  barcodeButton.addEventListener('click', startQrScanner);

  // Handle settlement of shipment
  settleShipmentButton.addEventListener('click', async () => {
    const finalAmount = parseFloat(finalAmountInput.value.replace(/[^0-9.-]+/g, ""));
    console.log(`Final Amount Entered: ${finalAmount}`);

    if (isNaN(finalAmount)) {
      messageStep2.textContent = 'Please enter a valid final amount';
      messageStep2.className = 'message error';
      messageStep2.style.display = 'block';
      console.log('Final amount validation failed: NaN.');
      return;
    }

    const orderId = orderIdInput.value.trim();
    try {
      const order = await fetchOrderDetails(orderId);
      const authorizationAmount = order.AuthorizationAmount;
      console.log(`Authorization Amount: ${authorizationAmount}`);

      if (finalAmount > authorizationAmount) {
        messageStep2.textContent = 'Final amount exceeds the authorized amount!';
        messageStep2.className = 'message error';
        messageStep2.style.display = 'block';
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
          orderId: orderId,
          finalAmount: finalAmount
        }),
      });

      const result = await response.json();
      console.log('Settlement response:', result);

      if (!response.ok) {
        messageStep2.textContent = `Error: ${result.message}`;
        messageStep2.className = 'message error';
        console.log('Settlement failed.');
      } else {
        messageStep2.textContent = result.message;
        messageStep2.className = 'message success';
        console.log('Settlement successful.');
        // Proceed to Step 3
        proceedToStep3();
      }

      messageStep2.style.display = 'block';

    } catch (error) {
      messageStep2.textContent = error.message;
      messageStep2.className = 'message error';
      messageStep2.style.display = 'block';
      console.error('Error during settlement:', error);
    }
  });

  // Function to proceed to Step 3
  const proceedToStep3 = () => {
    step2Container.style.display = 'none';
    step3Container.style.display = 'block';
  };

  // Function to print the shipment label
  const printLabel = async () => {
    const orderId = orderIdInput.value.trim();
    console.log(`Printing label for Order ID: ${orderId}`);
    try {
      const order = await fetchOrderDetails(orderId);
      const shippingAddress = order.ShippingAddress;

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
      messageStep2.textContent = 'Error printing label. Please try again.';
      messageStep2.className = 'message error';
      messageStep2.style.display = 'block';
    }
  };

  // Attach the printLabel function to the print button
  printLabelButton.addEventListener('click', printLabel);

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
});
