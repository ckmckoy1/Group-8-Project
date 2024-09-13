document.addEventListener('DOMContentLoaded', function () {
    const checkoutForm = document.getElementById('checkoutForm');
    const messageDiv = document.getElementById('message');
    const popupOverlay = document.getElementById('popupOverlay');
    const closePopup = document.getElementById('closePopup');

    // Auto-format phone number as (###) ###-####
    document.getElementById('phone').addEventListener('input', function (e) {
        let input = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
        
        if (input.length <= 3) {
            input = '(' + input;
        } else if (input.length <= 6) {
            input = '(' + input.substring(0, 3) + ') ' + input.substring(3);
        } else {
            input = '(' + input.substring(0, 3) + ') ' + input.substring(3, 6) + '-' + input.substring(6, 10);
        }

        e.target.value = input.substring(0, 14); // Limit the length to (###) ###-####
    });

    // Auto-format expiration date (MM/YY)
    document.getElementById('expDate').addEventListener('input', function (e) {
        let input = e.target.value.replace(/\D/g, ''); // Remove any non-digit characters
        if (input.length > 2) {
            input = input.substring(0, 2) + '/' + input.substring(2, 4);
        }
        e.target.value = input;
    });

    // Auto-format card number as #### #### #### ####
    document.getElementById('cardNumber').addEventListener('input', function (e) {
        let input = e.target.value.replace(/\D/g, ''); // Remove any non-digit characters
        input = input.match(/.{1,4}/g)?.join(' ') || input; // Add space every 4 digits
        e.target.value = input;
    });

    // Copy shipping ZIP code to billing if checkbox is checked
    document.getElementById('sameAsShipping').addEventListener('change', function (e) {
        if (e.target.checked) {
            document.getElementById('zipCode').value = document.getElementById('zip').value;
        } else {
            document.getElementById('zipCode').value = ''; // Clear if unchecked
        }
    });

    // Function to validate fields in the current section before proceeding
    function collapseSectionWithValidation(currentSectionId, nextSectionId) {
        const currentSection = document.getElementById(currentSectionId);
        const requiredFields = currentSection.querySelectorAll('input[required]');
        let isValid = true;

        // Validate each required field
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.border = '2px solid red'; // Highlight missing fields
                isValid = false;
            } else {
                field.style.border = ''; // Reset border if filled
            }
        });

        if (isValid) {
            // Collapse the current section
            currentSection.querySelector('.form-content').style.display = 'none';

            // Expand the next section
            const nextSection = document.getElementById(nextSectionId);
            nextSection.querySelector('.form-content').style.display = 'block';
        } else {
            alert('Please fill out all required fields.');
        }
    }

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

        // Select the appropriate mock endpoint based on card type
        let mockEndpoint;
        if (cardNumber.startsWith('4111')) {
            mockEndpoint = 'https://run.mocky.io/v3/b4e53431-c19e-4853-93c9-03d1cdd1e6f3'; // Success
        } else if (cardNumber.startsWith('5105')) {
            mockEndpoint = 'https://run.mocky.io/v3/52371a52-83fc-4edd-84d1-bfeee1a5f448'; // Incorrect details
        } else {
            mockEndpoint = 'https://run.mocky.io/v3/9027a69f-0b17-4f9d-912f-16e0342c1b38'; // Insufficient funds
        }

        try {
            // Simulate payment via mock endpoint
            const paymentResponse = await fetch(mockEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    OrderId: 'ORD000123', // This can be dynamically generated in a real scenario
                    CardDetails: {
                        Number: cardNumber,
                        ExpirationDate: expDate,
                        CVC: securityCode,
                        NameOnCard: `${firstName} ${lastName}`
                    },
                    AuthorizationAmount: 50.00 // Sample amount for authorization
                })
            });

            const paymentResult = await paymentResponse.json();

            if (paymentResult.Success) {
                // Payment success: Submit order to the backend (MongoDB storage)
                const orderResponse = await fetch('https://group8-a70f0e413328.herokuapp.com/api/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderData),
                });

                const orderResult = await orderResponse.json();

                if (!orderResponse.ok) {
                    displayMessage(`Error: ${orderResult.message}`, 'error');
                } else {
                    displayMessage(`Order submitted successfully! Order ID: ${orderResult.orderId}`, 'success');
                }
            } else {
                displayMessage(`Error: ${paymentResult.Reason}`, 'error');
            }
        } catch (error) {
            console.error('Error during payment or order submission:', error);
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
});
