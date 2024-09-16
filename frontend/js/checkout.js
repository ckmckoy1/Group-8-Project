document.addEventListener('DOMContentLoaded', function () {
    const checkoutForm = document.getElementById('checkoutForm');
    const messageDiv = document.getElementById('message');
    const popupOverlay = document.getElementById('popupOverlay');
    const closePopup = document.getElementById('closePopup');
    const requiredFieldsSection1 = ['email', 'phone', 'firstName', 'lastName', 'address', 'city', 'state', 'zip'];

    // Popups: Chat and Feedback
    const chatPopupOverlay = document.getElementById('chatPopupOverlay');
    const feedbackPopupOverlay = document.getElementById('feedbackPopupOverlay');
    const closeChatPopup = document.getElementById('closeChatPopup');
    const closeFeedbackPopup = document.getElementById('closeFeedbackPopup');

    // Utility function to display messages
    const displayMessage = (message, type) => {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
    };

    // Add asterisks for missing fields
    const addAsteriskForMissingFields = (fieldId) => {
        const label = document.querySelector(`label[for="${fieldId}"]`);
        if (label && !label.querySelector('.asterisk')) {
            label.innerHTML += ' <span class="asterisk" style="color: red;">*</span>';
        }
    };

    // Validate fields in Section 1
    const validateSection1 = () => {
        let isValid = true;
        requiredFieldsSection1.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const label = document.querySelector(`label[for="${fieldId}"]`);

            if (!field.value.trim()) {
                field.style.border = '2px solid red'; 
                addAsteriskForMissingFields(fieldId); 
                isValid = false;
            } else {
                field.style.border = ''; 
                const asterisk = label.querySelector('.asterisk');
                if (asterisk) asterisk.remove();
            }
        });
        return isValid;
    };

    // Collapse current section and show the next
    const collapseSectionWithValidation = (currentSectionId, nextSectionId) => {
        if (validateSection1()) {
            document.getElementById(currentSectionId).querySelector('.form-content').style.display = 'none';
            document.getElementById(nextSectionId).querySelector('.form-content').style.display = 'block';
        } else {
            alert('Please complete the full form.');
        }
    };

    // Auto-format phone number as (###) ###-####
    document.getElementById('phone').addEventListener('input', (e) => {
        let input = e.target.value.replace(/\D/g, '');
        if (input.length <= 3) {
            input = '(' + input;
        } else if (input.length <= 6) {
            input = '(' + input.substring(0, 3) + ') ' + input.substring(3);
        } else {
            input = '(' + input.substring(0, 3) + ') ' + input.substring(3, 6) + '-' + input.substring(6);
        }
        e.target.value = input.substring(0, 14);
    });

    // Auto-format expiration date (MM/YY)
    document.getElementById('expDate').addEventListener('input', (e) => {
        let input = e.target.value.replace(/\D/g, '');
        if (input.length > 2) input = input.substring(0, 2) + '/' + input.substring(2, 4);
        e.target.value = input;
    });

    // Auto-format card number as #### #### #### ####
    document.getElementById('cardNumber').addEventListener('input', (e) => {
        let input = e.target.value.replace(/\D/g, '');
        e.target.value = input.match(/.{1,4}/g)?.join(' ') || input;
    });

    // Copy shipping ZIP to billing ZIP
    document.getElementById('sameAsShipping').addEventListener('change', (e) => {
        const billingZip = document.getElementById('zipCode');
        if (e.target.checked) {
            billingZip.value = document.getElementById('zip').value;
        } else {
            billingZip.value = '';
        }
    });

    // Validate card expiration
    const isCardExpired = (expDate) => {
        const [month, year] = expDate.split('/').map(Number);
        const exp = new Date(`20${year}-${month}-01`);
        return new Date() > exp;
    };

    // Close popup handler
    const closePopupHandler = () => popupOverlay.classList.remove('show');
    closePopup.addEventListener('click', closePopupHandler);
    popupOverlay.addEventListener('click', (event) => {
        if (event.target === popupOverlay) closePopupHandler();
    });

    // Handle form submission and show order popup
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const orderData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: `${document.getElementById('address').value} ${document.getElementById('unitNumber').value}, ${document.getElementById('city').value}, ${document.getElementById('state').value}, ${document.getElementById('zip').value}`,
            shippingMethod: document.querySelector('input[name="shippingMethod"]:checked').value,
            paymentDetails: {
                cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
                expDate: document.getElementById('expDate').value,
                securityCode: document.getElementById('securityCode').value,
                billingZipCode: document.getElementById('zipCode').value
            }
        };

        if (isCardExpired(orderData.paymentDetails.expDate)) {
            displayMessage('Error: Your card has expired.', 'error');
            return;
        }

        try {
            const paymentResponse = await fetch('https://run.mocky.io/v3/b4e53431-c19e-4853-93c9-03d1cdd1e6f3', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    OrderId: 'ORD000123',
                    CardDetails: orderData.paymentDetails,
                    AuthorizationAmount: 50.00
                })
            });

            const paymentResult = await paymentResponse.json();
            if (paymentResult.Success) {
                const orderResponse = await fetch('https://group8-a70f0e413328.herokuapp.com/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                const orderResult = await orderResponse.json();
                if (orderResponse.ok) {
                    displayMessage(`Order submitted successfully! Order ID: ${orderResult.orderId}`, 'success');
                    popupOverlay.classList.add('show');
                } else {
                    displayMessage(`Error: ${orderResult.message}`, 'error');
                }
            } else {
                displayMessage(`Error: ${paymentResult.Reason}`, 'error');
            }
        } catch (error) {
            displayMessage('Error: Something went wrong!', 'error');
        }
    });

    // Chat Popup Logic
    closeChatPopup.addEventListener('click', () => chatPopupOverlay.classList.remove('show'));
    chatPopupOverlay.addEventListener('click', (event) => {
        if (event.target === chatPopupOverlay) chatPopupOverlay.classList.remove('show');
    });

    // Feedback Popup Logic
    closeFeedbackPopup.addEventListener('click', () => feedbackPopupOverlay.classList.remove('show'));
    feedbackPopupOverlay.addEventListener('click', (event) => {
        if (event.target === feedbackPopupOverlay) feedbackPopupOverlay.classList.remove('show');
    });
});
