document.addEventListener('DOMContentLoaded', function () {
    const checkoutForm = document.getElementById('checkoutForm');
    const messageDiv = document.getElementById('message');
    const popupOverlay = document.getElementById('popupOverlay');
    const closePopup = document.getElementById('closePopup');

    // Auto-format phone number as (###) ###-####
    document.getElementById('phone').addEventListener('input', function (e) {
        let input = e.target.value.replace(/\D/g, '');
        if (input.length <= 3) {
            input = '(' + input;
        } else if (input.length <= 6) {
            input = '(' + input.substring(0, 3) + ') ' + input.substring(3);
        } else {
            input = '(' + input.substring(0, 3) + ') ' + input.substring(3, 6) + '-' + input.substring(6, 10);
        }
        e.target.value = input.substring(0, 14);
    });

    // Auto-format expiration date (MM/YY)
    document.getElementById('expDate').addEventListener('input', function (e) {
        let input = e.target.value.replace(/\D/g, '');
        if (input.length > 2) {
            input = input.substring(0, 2) + '/' + input.substring(2, 4);
        }
        e.target.value = input;
    });

    // Auto-format card number as #### #### #### ####
    document.getElementById('cardNumber').addEventListener('input', function (e) {
        let input = e.target.value.replace(/\D/g, '');
        input = input.match(/.{1,4}/g)?.join(' ') || input;
        e.target.value = input;
    });

    // Copy shipping ZIP code to billing if checkbox is checked
    document.getElementById('sameAsShipping').addEventListener('change', function (e) {
        if (e.target.checked) {
            document.getElementById('zipCode').value = document.getElementById('zip').value;
        } else {
            document.getElementById('zipCode').value = '';
        }
    });

    // Show the Section 1: Shipping and Billing 
    document.addEventListener('DOMContentLoaded', function () {
        // Ensure the first section is visible by default
        document.querySelector('#shippingBillingSection .form-content').classList.add('show');
        
        // The rest of your JavaScript logic here
    });
    

    // Function to validate fields in the current section before proceeding
    function collapseSectionWithValidation(currentSectionId, nextSectionId) {
        const currentSection = document.getElementById(currentSectionId);
        const requiredFields = currentSection.querySelectorAll('input[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.style.border = '2px solid red';
                isValid = false;
            } else {
                field.style.border = '';
            }
        });

        if (isValid) {
            currentSection.querySelector('.form-content').style.display = 'none';
            const nextSection = document.getElementById(nextSectionId);
            nextSection.querySelector('.form-content').style.display = 'block';
        } else {
            alert('Please fill out all required fields.');
        }
    }

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

    closePopup.addEventListener('click', closePopupHandler);
    popupOverlay.addEventListener('click', (event) => {
        if (event.target === popupOverlay) {
            closePopupHandler();
        }
    });

    // Handle form submission and show popup after successful submission
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Gather form values
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

        const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
        const expDate = document.getElementById('expDate').value;
        const securityCode = document.getElementById('securityCode').value;
        const billingZipCode = document.getElementById('zipCode').value;

        if (isCardExpired(expDate)) {
            displayMessage('Error: Your card has expired.', 'error');
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

        try {
            // Simulate payment via mock endpoint
            const paymentResponse = await fetch('https://run.mocky.io/v3/b4e53431-c19e-4853-93c9-03d1cdd1e6f3', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    OrderId: 'ORD000123',
                    CardDetails: {
                        Number: cardNumber,
                        ExpirationDate: expDate,
                        CVC: securityCode,
                        NameOnCard: `${firstName} ${lastName}`
                    },
                    AuthorizationAmount: 50.00
                })
            });

            const paymentResult = await paymentResponse.json();

            if (paymentResult.Success) {
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
                    popupOverlay.classList.add('show'); // Show popup only after submission
                }
            } else {
                displayMessage(`Error: ${paymentResult.Reason}`, 'error');
            }
        } catch (error) {
            console.error('Error during payment or order submission:', error);
            displayMessage('Error: Something went wrong!', 'error');
        }
    });
});
