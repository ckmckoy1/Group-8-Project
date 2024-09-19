document.addEventListener('DOMContentLoaded', () => {
    const settleForm = document.getElementById('settleShipmentForm');
    const messageDiv = document.getElementById('message');
    const finalAmountInput = document.getElementById('finalAmount');

    // Handle form submission for settling the shipment
    settleForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const orderId = document.getElementById('orderId').value;
        const finalAmount = parseFloat(finalAmountInput.value.replace(/[^0-9.-]+/g,"")); // Remove formatting before sending

        try {
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

    // Format the finalAmount input as currency
    finalAmountInput.addEventListener('input', (event) => {
        // Get the current value without formatting
        let inputVal = event.target.value;

        // Remove any non-numeric characters except for the decimal point
        inputVal = inputVal.replace(/[^0-9.]/g, '');

        // Convert the value to a number and format it as currency
        const formattedValue = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(inputVal);

        // Set the formatted value back to the input field
        event.target.value = formattedValue;
    });
});
