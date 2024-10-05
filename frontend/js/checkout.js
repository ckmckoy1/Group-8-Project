document.addEventListener('DOMContentLoaded', function () {
    const checkoutForm = document.getElementById('checkoutForm');
    const popupOverlay = document.getElementById('popupOverlay');
    const closePopup = document.getElementById('closePopup');
    const messageDiv = document.getElementById('message'); // Make sure this element exists in your HTML

    // Buttons for moving to next sections
    const continueToPaymentBtn = document.getElementById('continueToPayment');
    const continueToReviewBtn = document.getElementById('continueToReview');

    // Mock Endpoint URLs
    const mockEndpointSuccess = 'https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=success';
    const mockEndpointFailureDetails = 'https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=carddetails';
    const mockEndpointFailureFunds = 'https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=insufficient';


    // Required fields by section
    const requiredFieldsSection1 = ['email', 'phone', 'firstName', 'lastName', 'address', 'city', 'state', 'zip'];
    const requiredFieldsSection2 = ['cardNumber', 'expDate', 'securityCode', 'billingAddress', 'billingCity', 'billingState', 'billingZipCode'];

    // Function to add asterisk for missing fields
    function addAsteriskForMissingFields(fieldId) {
        const label = document.querySelector(`label[for="${fieldId}"]`);
        if (label && !label.querySelector('.asterisk')) {
            label.innerHTML += ' <span class="asterisk" style="color: red;">*</span>';
        }
    }

    // Function to validate a specific section
    function validateSection(requiredFields) {
        let isValid = true;
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const label = document.querySelector(`label[for="${fieldId}"]`);

            if (!field.value.trim()) {
                field.style.border = '2px solid red'; // Highlight empty fields
                addAsteriskForMissingFields(fieldId); // Add asterisk for missing fields
                isValid = false;
            } else {
                field.style.border = ''; // Reset border if filled
                const asterisk = label?.querySelector('.asterisk');
                if (asterisk) {
                    asterisk.remove();
                }
            }
        });
        return isValid;
    }

    // Function to validate the shipping method (radio button)
    function validateShippingMethod() {
        const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked');
        if (!shippingMethod) {
            alert('Please select a shipping method.');
            return false;
        }
        return true;
    }

    // Function to collapse current section and open the next
    function collapseSectionWithValidation(currentSectionId, nextSectionId, requiredFields) {
        const isValid = validateSection(requiredFields);
        const isShippingValid = validateShippingMethod();

        if (isValid && isShippingValid) {
            // Collapse current section
            document.getElementById(currentSectionId).querySelector('.form-content').style.display = 'none';
            // Open the next section
            document.getElementById(nextSectionId).querySelector('.form-content').style.display = 'block';
        } else {
            alert('Please complete all required fields in this section.');
        }
    }

    // Section 1: Continue to Payment (validates Section 1 fields)
    continueToPaymentBtn.addEventListener('click', function () {
        collapseSectionWithValidation('shippingSection', 'paymentSection', requiredFieldsSection1);
    });

    // Section 2: Continue to Review (validates Section 2 fields)
    continueToReviewBtn.addEventListener('click', function () {
        collapseSectionWithValidation('paymentSection', 'reviewOrderSection', requiredFieldsSection2);
    });

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

// Event listener for the "Same as Shipping" checkbox
document.getElementById('sameAsShipping').addEventListener('change', function (e) {
    if (e.target.checked) {
        // Copy values from shipping address to billing address
        document.getElementById('billingAddress').value = document.getElementById('address').value;
        document.getElementById('billingCity').value = document.getElementById('city').value;
        document.getElementById('billingState').value = document.getElementById('state').value;
        document.getElementById('billingZipCode').value = document.getElementById('zip').value;
    } else {
        // Clear billing address fields when unchecked
        document.getElementById('billingAddress').value = '';
        document.getElementById('billingCity').value = '';
        document.getElementById('billingState').value = '';
        document.getElementById('billingZipCode').value = '';
    }
});


    // Validate the expiration date
    const isCardExpired = (expDate) => {
        const today = new Date();
        const [month, year] = expDate.split('/').map(Number);
        const exp = new Date(`20${year}-${month}-01`);
        return today > exp;
    };

    // Function to display error/success messages
    const displayMessage = (message, type) => {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    };

    // Final submission
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Validate payment section before final submission
        const isSection2Valid = validateSection(requiredFieldsSection2);
        if (!isSection2Valid) {
            return;
        }

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
        const billingAddress = document.getElementById('billingAddress').value;
        const billingCity = document.getElementById('billingCity').value;
        const billingState = document.getElementById('billingState').value;
        const billingZipCode = document.getElementById('billingZipCode').value;

        // Check card expiration
        if (isCardExpired(expDate)) {
            displayMessage('Error: Your card has expired.', 'error');
            return;
        }

        // Determine mock URL based on card number (first digit simulation)
        let mockUrl;
        if (cardNumber.startsWith('4111')) {
            mockUrl = mockEndpointSuccess;
        } else if (cardNumber.startsWith('5105')) {
            mockUrl = mockEndpointFailureDetails;
        } else {
            mockUrl = mockEndpointFailureFunds;
        }

        // Prepare order data
        const orderData = {
            firstName,
            lastName,
            email,
            phone,
            address: `${address} ${unitNumber}, ${city}, ${state}, ${zip}`,
            shippingMethod,
            billingAddress: `${billingAddress}, ${billingCity}, ${billingState}, ${billingZipCode}`,
            paymentDetails: {
                cardNumber,
                expDate,
                securityCode
            }
        };

        try {
            // Send a request to the mock payment endpoint
            const paymentResponse = await fetch(mockUrl, {
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
                // Send order details to MongoDB after payment success
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
                    popupOverlay.classList.add('show'); // Show success popup
                }
            } else {
                // Handle payment failure
                displayMessage(`Payment failed: ${paymentResult.Reason}`, 'error');
            }
        } catch (error) {
            console.error('Error during payment or order submission:', error);
            displayMessage('Error: Something went wrong!', 'error');
        }
    });

    // Close popup functionality
    closePopup.addEventListener('click', () => popupOverlay.classList.remove('show'));
});
