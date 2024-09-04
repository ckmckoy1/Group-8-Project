document.addEventListener('DOMContentLoaded', () => {
    const settleForm = document.getElementById('settleForm');
    const messageDiv = document.getElementById('message');

    // Handle form submission for settling the shipment
    settleForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const orderId = document.getElementById('orderId').value;
        const finalAmount = parseFloat(document.getElementById('finalAmount').value);

        try {
            const response = await fetch('/settle-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId, finalAmount }),
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.textContent = 'Order settled successfully!';
                messageDiv.className = 'message success';
            } else {
                messageDiv.textContent = `Error: ${data.error}`;
                messageDiv.className = 'message error';
            }
        } catch (error) {
            messageDiv.textContent = 'Error: Unable to settle the order. Please try again later.';
            messageDiv.className = 'message error';
        }

        messageDiv.style.display = 'block';
    });
});
