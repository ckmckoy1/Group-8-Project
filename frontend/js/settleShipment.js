document.addEventListener('DOMContentLoaded', () => {
    const settleForm = document.getElementById('settleShipmentForm');
    const messageDiv = document.getElementById('message');
    const finalAmountInput = document.getElementById('finalAmount');

    // Fetch order details to verify amounts
    const fetchOrderDetails = async (orderId) => {
        try {
            const response = await fetch(`/api/orders/${orderId}`);
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
        const finalAmount = parseFloat(finalAmountInput.value.replace(/[^0-9.-]+/g, "")); // Remove formatting before sending
        const orderId = document.getElementById('orderId').value;

        if (!orderId.trim() || isNaN(finalAmount)) {
            messageDiv.textContent = 'Please enter a valid Order ID and Amount';
            messageDiv.className = 'message error';
            messageDiv.style.display = 'block';
            return;
        }

        try {
            // Fetch order details first to compare amounts
            const order = await fetchOrderDetails(orderId);
            const authorizationAmount = order.AuthorizationAmount;

            // Perform client-side comparison before sending settlement request
            if (finalAmount > authorizationAmount) {
                messageDiv.textContent = 'Final amount exceeds authorized amount!';
                messageDiv.className = 'message error';
                messageDiv.style.display = 'block';
                return;
            }

            // Send settlement request if amounts are valid
            const response = await fetch('/api/settle-shipment', {
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
