document.addEventListener('DOMContentLoaded', function () {
    const checkoutForm = document.getElementById('checkoutForm');
    const messageDiv = document.getElementById('message');

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

        // Temporary bypass for missing mock endpoints
        displayMessage('Success: Payment authorized (temporary bypass)!', 'success');
        
        // Prepare order data
        const orderData = {
            orderId: orderId,
            firstName: firstName,
            lastName: lastName,
            address: address,
            cardDetails: {
                number: cardNumber,
                expirationDate: expDate,
                cvv: securityCode,
                zipCode: zipCode
            }
        };

        // Uncomment and use this block once the mock endpoints are ready

        /*
        let mockEndpoint;
        if (cardNumber.startsWith('4111')) {
            mockEndpoint = 'https://run.mocky.io/v3/266bd809-da31-49a2-9e05-7a379d941741'; // Success
        } else if (cardNumber.startsWith('5105')) {
            mockEndpoint = 'https://run.mocky.io/v3/023b1b8c-c9dd-40a5-a3bd-b21bcde402d4'; // Incorrect details
        } else {
            mockEndpoint = 'https://run.mocky.io/v3/ef002405-2fd7-4c62-87ee-42b0142cc588'; // Insufficient funds
        }

        try {
            const response = await fetch(mockEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    OrderId: orderId,
                    CardDetails: {
                        Number: cardNumber,
                        ExpirationDate: expDate,
                        CVC: securityCode,
                        NameOnCard: `${firstName} ${lastName}`
                    },
                    AuthorizationAmount: 50.00 // Sample amount for authorization
                })
            });

            const data = await response.json();

            if (data.Success) {
                displayMessage(`Success: Payment authorized! Token: ${data.AuthorizationToken}`, 'success');
                // Save the transaction details (optional, for back-end implementation)
            } else {
                displayMessage(`Error: ${data.Reason}`, 'error');
            }
        } catch (error) {
            console.error('Payment authorization failed:', error);
            displayMessage('Error: Something went wrong!', 'error');
        }
        */

        // Optionally, send order data to the backend for storage
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const result = await response.json();
                displayMessage(`Error: ${result.message}`, 'error');
            } else {
                displayMessage('Order submitted successfully!', 'success');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            displayMessage('Error: Something went wrong!', 'error');
        }
    });

    // Auto-generate the Order ID on page load
    window.onload = function () {
        const orderId = 'NS-' + Math.floor(100000 + Math.random() * 900000);
        document.getElementById('orderId').value = orderId;
    };
});
