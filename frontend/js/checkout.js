// checkout.js

document.addEventListener('DOMContentLoaded', function () {
    const checkoutForm = document.getElementById('checkoutForm');
    const popupOverlay = document.getElementById('popupOverlay');
    const closePopup = document.getElementById('closePopup');
    const messageDiv = document.getElementById('message'); // Ensure this element exists in your HTML

    // Buttons for moving to next sections
    const continueToPaymentBtn = document.getElementById('continueToPayment');
    const continueToReviewBtn = document.getElementById('continueToReview');

    // Order Total (Assuming $50.00 for this example)
    const orderTotal = 50.00;

    // Event listener for payment method change
    const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');
    paymentMethodInputs.forEach(input => {
        input.addEventListener('change', function () {
            handlePaymentMethodChange();
        });
    });

    // Shipping methods mapping
    const shippingMethods = {
        'Standard': { daysMin: 5, daysMax: 7, cost: 0.00 },
        'Expedited': { daysMin: 3, daysMax: 4, cost: 9.00 },
        'Rush': { daysMin: 1, daysMax: 2, cost: 25.00 }
    };

    // Required fields by section
    const requiredFieldsSection1 = ['email', 'phone', 'firstName', 'lastName', 'address', 'city', 'state', 'zip'];
    const requiredFieldsSection2 = ['cardNumber', 'expDate', 'securityCode', 'billingName', 'billingAddress', 'billingCity', 'billingState', 'billingZipCode'];

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
        // Auto-format the card number
        let input = e.target.value.replace(/\D/g, '');
        input = input.match(/.{1,4}/g)?.join(' ') || input;
        e.target.value = input;

        // Get the card brand
        const cardBrand = getCardBrand(e.target.value);

        // Update the card brand display
        const cardBrandDisplay = document.getElementById('cardBrandDisplay');
        if (cardBrand !== 'Unknown') {
            cardBrandDisplay.textContent = `Card Type: ${cardBrand}`;
        } else {
            cardBrandDisplay.textContent = '';
        }
    });

    // Function to handle payment method change
    function handlePaymentMethodChange() {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const creditCardFields = document.getElementById('creditCardFields');
        const klarnaPayment = document.getElementById('klarnaPayment');
        const paypalPayment = document.getElementById('paypalPayment');
        const reviewOrderSection = document.getElementById('reviewOrderSection');

        if (selectedMethod === 'creditCard') {
            creditCardFields.style.display = 'block';
            klarnaPayment.style.display = 'none';
            paypalPayment.style.display = 'none';
            reviewOrderSection.style.display = 'block'; // Show Section 3
        } else if (selectedMethod === 'klarna') {
            creditCardFields.style.display = 'none';
            klarnaPayment.style.display = 'block';
            paypalPayment.style.display = 'none';
            reviewOrderSection.style.display = 'none'; // Hide Section 3
        } else if (selectedMethod === 'paypal') {
            creditCardFields.style.display = 'none';
            klarnaPayment.style.display = 'none';
            paypalPayment.style.display = 'block';
            reviewOrderSection.style.display = 'none'; // Hide Section 3
        }
    }

    // Initialize payment method display
    handlePaymentMethodChange();

    // Event listener for Klarna button
    document.getElementById('klarnaButton').addEventListener('click', function () {
        // Implement your Klarna payment integration here
        alert('Redirecting to Klarna payment gateway...');
        // For example, redirect to Klarna checkout page
        // window.location.href = 'https://www.klarna.com/checkout-url';
    });

    // Event listener for PayPal button
    document.getElementById('paypalButton').addEventListener('click', function () {
        // Implement your PayPal payment integration here
        alert('Redirecting to PayPal...');
        // For example, redirect to PayPal checkout page
        // window.location.href = 'https://www.paypal.com/checkout-url';
    });

    function getCardBrand(number) {
        const sanitized = number.replace(/\D/g, '');

        const patterns = [
            { brand: 'Visa', pattern: /^4[0-9]{12}(?:[0-9]{3})?$/ },
            { brand: 'MasterCard', pattern: /^(5[1-5][0-9]{14}|2[2-7][0-9]{14})$/ },
            { brand: 'American Express', pattern: /^3[47][0-9]{13}$/ },
            { brand: 'Discover', pattern: /^6(?:011|5[0-9]{2})[0-9]{12}$/ },
            // Add patterns for other card brands if needed
        ];

        for (const { brand, pattern } of patterns) {
            if (pattern.test(sanitized)) {
                return brand;
            }
        }
        return 'Unknown';
    }

    // Function to update shipping options with estimated dates and costs
    function updateShippingOptions() {
        const today = new Date();

        Object.keys(shippingMethods).forEach(method => {
            const shippingInfo = shippingMethods[method];
            const estDays = shippingInfo.daysMax;
            const estDeliveryDate = new Date(today);
            estDeliveryDate.setDate(estDeliveryDate.getDate() + estDays);

            // Format the estimated delivery date
            const options = { weekday: 'long', month: 'short', day: 'numeric' };
            const estDateStr = `Est. arrival ${estDeliveryDate.toLocaleDateString(undefined, options)}`;

            // Update the estimated date in the HTML
            document.getElementById(`${method.toLowerCase()}EstDate`).textContent = estDateStr;

            // Determine the shipping cost
            let shippingCost = shippingInfo.cost;
            if (method === 'Standard' && orderTotal >= 35.00) {
                shippingCost = 0;
            }

            // Update the shipping cost in the HTML
            document.getElementById(`${method.toLowerCase()}Cost`).textContent = `$${shippingCost.toFixed(2)}`;
        });
    }

    // Function to calculate shipping cost
    function calculateShippingCost() {
        const selectedMethodElement = document.querySelector('input[name="shippingMethod"]:checked');
        if (!selectedMethodElement) {
            console.error('No shipping method selected');
            return 0;
        }
        const selectedMethod = selectedMethodElement.value;
        const shippingInfo = shippingMethods[selectedMethod];

        let shippingCost = shippingInfo.cost;

        // If Standard Shipping and order total >= $35, shipping is free
        if (selectedMethod === 'Standard' && orderTotal >= 35.00) {
            shippingCost = 0;
        }

        return shippingCost;
    }

    // Function to update order summary
    function updateOrderSummary() {
        // Calculate and display shipping cost
        const shippingCost = calculateShippingCost();

        const shippingCostDisplay = document.getElementById('shippingCostDisplay');
        if (shippingCostDisplay) {
            shippingCostDisplay.textContent = shippingCost.toFixed(2);
        }

        // Calculate and display grand total
        const grandTotal = orderTotal + shippingCost;

        const grandTotalDisplay = document.getElementById('grandTotalDisplay');
        if (grandTotalDisplay) {
            grandTotalDisplay.textContent = grandTotal.toFixed(2);
        }
    }

    // Event listeners to update order summary when shipping method changes
    const shippingMethodInputs = document.querySelectorAll('input[name="shippingMethod"]');
    shippingMethodInputs.forEach(input => {
        input.addEventListener('change', function () {
            updateOrderSummary();
        });
    });

    // Initialize on page load
    updateShippingOptions();
    updateOrderSummary();

    // Event listener for the "Same as Shipping" checkbox
    document.getElementById('sameAsShipping').addEventListener('change', function (e) {
        if (e.target.checked) {
            const shippingAddress = document.getElementById('address').value;
            const shippingUnitNumber = document.getElementById('unitNumber').value;
            const shippingCity = document.getElementById('city').value;
            const shippingState = document.getElementById('state').value;
            const shippingZip = document.getElementById('zip').value;

            // Copy values from shipping to billing fields
            document.getElementById('billingAddress').value = shippingAddress || '';
            document.getElementById('billingUnitNumber').value = shippingUnitNumber || '';
            document.getElementById('billingCity').value = shippingCity || '';
            document.getElementById('billingState').value = shippingState || '';
            document.getElementById('billingZipCode').value = shippingZip || '';
        } else {
            // Clear billing address fields when unchecked
            document.getElementById('billingAddress').value = '';
            document.getElementById('billingUnitNumber').value = '';
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
            displayMessage('Please complete all required payment fields.', 'error');
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
        const billingName = document.getElementById('billingName').value;
        const billingAddress = document.getElementById('billingAddress').value;
        const billingUnitNumber = document.getElementById('billingUnitNumber').value;
        const billingCity = document.getElementById('billingCity').value;
        const billingState = document.getElementById('billingState').value;
        const billingZipCode = document.getElementById('billingZipCode').value;

        // Check card expiration
        if (isCardExpired(expDate)) {
            displayMessage('Error: Your card has expired.', 'error');
            return;
        }

        // Get the card brand
        const cardBrand = getCardBrand(cardNumber);

        if (cardBrand === 'Unknown') {
            displayMessage('Error: Unknown card brand. Please check your card number.', 'error');
            return;
        }

        // Prepare order data
        const orderData = {
            firstName,
            lastName,
            email,
            phone,
            shippingAddress: {
                address,
                unitNumber,
                city,
                state,
                zip,
            },
            shippingMethod,
            billingAddress: {
                address: billingAddress,
                unitNumber: billingUnitNumber,
                city: billingCity,
                state: billingState,
                zipCode: billingZipCode,
            },
            paymentDetails: {
                cardNumber,
                expDate,
                cvv: securityCode,
                cardHolderName: billingName,
                cardBrand,
            },
            orderTotal,
        };

        try {
            // Send order details to your backend server (e.g., to MongoDB)
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            const result = await response.json();

            if (response.ok) {
                displayMessage(`Order submitted successfully! Order ID: ${result.orderId}`, 'success');
                popupOverlay.classList.add('show'); // Show success popup
            } else {
                displayMessage(`Error: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Error during order submission:', error);
            displayMessage('Error: Something went wrong during order submission!', 'error');
        }
    });

    // Close popup functionality
    closePopup.addEventListener('click', () => {
        popupOverlay.classList.remove('show');
        // Optionally, reset the form after successful submission
        // checkoutForm.reset();
    });

    // Function to toggle sections (if needed)
    window.toggleSection = function (sectionId) {
        const section = document.getElementById(sectionId);
        const content = section.querySelector('.form-content');
        if (content.style.display === 'block' || content.style.display === '') {
            content.style.display = 'none';
        } else {
            content.style.display = 'block';
        }
    };
});
