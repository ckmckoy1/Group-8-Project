document.addEventListener('DOMContentLoaded', function () {
    const checkoutForm = document.getElementById('checkoutForm');
    const messageDiv = document.getElementById('message');
    const popupOverlay = document.getElementById('popupOverlay');
    const closePopup = document.getElementById('closePopup');

    // Function to mask credit card number
    const maskCardNumber = (cardNumber) => {
        return cardNumber.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    // Function to detect card type
    const detectCardType = (cardNumber) => {
        const re = {
            visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
            mastercard: /^5[1-5][0-9]{14}$/,
            amex: /^3[47][0-9]{13}$/
        };
        if (re.visa.test(cardNumber)) return 'Visa';
        if (re.mastercard.test(cardNumber)) return 'MasterCard';
        if (re.amex.test(cardNumber)) return 'American Express';
        return 'Unknown';
    };

    // Function to validate expiration date
    const isCardExpired = (expDate) => {
        const today = new Date();
        const [month, year] = expDate.split('/').map(Number);
        const exp = new Date(`20${year}-${month}-01`);
        return today > exp;
    };

    // Function to display messages
    const displayMessage = (message, type) => {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    };

    // Function to close popup
    const closePopupHandler = () => {
        popupOverlay.classList.remove('show');
    };

    // Show the popup after 2 seconds
    setTimeout(() => {
        popupOverlay.classList.add('show');
    }, 2000);

    // Close the popup when the close button is clicked
    closePopup.addEventListener('click', closePopupHandler);

    // Close the popup when clicking outside of it
    popupOverlay.addEventListener('click', (event) => {
        if (event.target === popupOverlay) {
            closePopupHandler();
        }
    });

    // Handle form submission
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Gather values from the form (excluding orderId as it will be generated in the backend)
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const unitNumber = document.getElementById('unitNumber').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        const zip = document.getElementById('zip').value;
        const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked').value;

        // Payment details
        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expDate = document.getElementById('expDate').value;
        const securityCode = document.getElementById('securityCode').value;
        const billingZipCode = document.getElementById('zipCode').value;

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

        // Simulate payment success for now
        displayMessage('Success: Payment authorized (temporary bypass)!', 'success');

        // Prepare order data
        const orderData = {
            firstName,
            lastName,
            email,
            phone,
            address: `${address} ${unitNumber}, ${city}, ${state}, ${zip}`,
            shippingMethod,
            paymentDetails: {
                cardNumber,
                expDate,
                securityCode,
                billingZipCode
            }
        };

        // Send order data to the backend (where orderId will be generated)
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            const result = await response.json();

            if (!response.ok) {
                displayMessage(`Error: ${result.message}`, 'error');
            } else {
                displayMessage(`Order submitted successfully! Order ID: ${result.orderId}`, 'success');
            }
        } catch (error) {
            console.error('Error submitting order:', error);
            displayMessage('Error: Something went wrong!', 'error');
        }
    });

    // Validate form fields
    function validateForm() {
        const requiredFields = document.querySelectorAll('input[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value) {
                field.style.border = '2px solid red'; // Highlight empty fields
                isValid = false;
            } else {
                field.style.border = ''; // Reset field border if filled
            }
        });

        return isValid;
    }

    // Mock payment endpoint - Uncomment once ready
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
        } else {
            displayMessage(`Error: ${data.Reason}`, 'error');
        }
    } catch (error) {
        console.error('Payment authorization failed:', error);
        displayMessage('Error: Something went wrong!', 'error');
    }
    */
});
