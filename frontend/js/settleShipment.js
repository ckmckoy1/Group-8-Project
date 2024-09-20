document.addEventListener('DOMContentLoaded', () => {
    const settleForm = document.getElementById('settleShipmentForm');
    const messageDiv = document.getElementById('message');
    const finalAmountInput = document.getElementById('finalAmount');

    // Fetch order details from your Heroku backend
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

        // Convert the finalAmount to a float by stripping out non-numeric characters
        const finalAmount = parseFloat(finalAmountInput.value.replace(/[^0-9.-]+/g, ""));
        const orderId = document.getElementById('orderId').value; // This is the input field value

        if (!orderId.trim() || isNaN(finalAmount)) {
            messageDiv.textContent = 'Please enter a valid Order ID and Amount';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return;
        }

        try {
            // Fetch the order details from the backend
            const order = await fetchOrderDetails(orderId);

            const authorizationAmount = order.AuthorizationAmount; // Must match the capitalization used in the Mongoose schema

            if (finalAmount > authorizationAmount) {
                messageDiv.textContent = 'Final amount exceeds authorized amount!';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                return;
            }

            // Send settlement request to your Heroku backend
            const response = await fetch('https://group8-a70f0e413328.herokuapp.com/api/settle-shipment', { // Full URL for Heroku
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.OrderID,  // Use the `OrderID` as it's defined in the backend schema
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
});
