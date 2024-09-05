document.addEventListener('DOMContentLoaded', function () {
    const checkoutForm = document.getElementById('checkoutForm');
    const messageDiv = document.getElementById('message');
    let mockOrders = [];

    // Function to mask credit card number
    function maskCardNumber(cardNumber) {
        return cardNumber.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    // Function to detect card type
    function detectCardType(cardNumber) {
        const re = {
            visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
            mastercard: /^5[1-5][0-9]{14}$/,
            amex: /^3[47][0-9]{13}$/
        };
        if (re.visa.test(cardNumber)) return 'Visa';
        if (re.mastercard.test(cardNumber)) return 'MasterCard';
        if (re.amex.test(cardNumber)) return 'American Express';
        return 'Unknown';
    }

    // Function to validate expiration date
    function isCardExpired(expDate) {
        const today = new Date();
        const [month, year] = expDate.split('/').map(Number);
        const exp = new Date(`20${year}-${month}-01`);
        return today > exp;
    }

    // Function to display messages
    function displayMessage(message, type) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    }

    // Handle form submission
    checkoutForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const orderId = document.getElementById('orderId').value;
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const address = document.getElementById('address').value;
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expDate = document.getElementById('expDate').value;
        const securityCode = document.getElementById('securityCode').value;
        const zipCode = document.getElementById('zipCode').value;

        // Client-side validations
        if (isCardExpired(expDate)) {
            displayMessage('Error: Your card has expired.', 'error');
            return;
        }

        const cardType = detectCardType(cardNumber);
        if (cardType === 'Unknown') {
            displayMessage('Error: Unsupported card type.', 'error');
            return;
        }

        // Temporary bypass for mock testing
        const isSuccess = Math.random() > 0.3; // Randomly decide success/failure

        if (isSuccess) {
            // Add to mockOrders array (simulating order storage)
            mockOrders.push({
                orderId,
                customer: `${firstName} ${lastName}`,
                address,
                cardNumber: maskCardNumber(cardNumber),
                expDate,
                status: 'Authorized'
            });

            displayMessage(`Success: Payment authorized for ${firstName} ${lastName}!`, 'success');
            console.log('Orders:', mockOrders); // View mock orders
        } else {
            displayMessage('Error: Payment failed!', 'error');
        }
    });

    // Auto-generate the Order ID on page load
    window.onload = function () {
        const orderId = 'NS-' + Math.floor(100000 + Math.random() * 900000);
        document.getElementById('orderId').value = orderId;
    };
});
