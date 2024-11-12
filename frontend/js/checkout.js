// Helper functions and variables
const ADDRESS_COMPONENT_TYPES = {
    shipping: {
        address: 'address',
        city: 'city',
        state: 'state',
        zip: 'zip',
        country: 'country'
    },
    billing: {
        address: 'billingAddress',
        city: 'billingCity',
        state: 'billingState',
        zip: 'billingZipCode',
        country: 'billingCountry' // Ensure you have this field in your HTML
    }
};

// Function to get the address input element by section and component type
function getAddressInputElement(section, componentType) {
    return document.getElementById(ADDRESS_COMPONENT_TYPES[section][componentType]);
}

// Function to fill in address fields based on the Google Place object
function fillInAddressFields(place, section) {
    // Mapping from Google Place types to your form fields
    const componentForm = {
        street_number: 'short_name',
        route: 'long_name',
        locality: 'long_name', // City
        administrative_area_level_1: 'short_name', // State
        postal_code: 'short_name',
        country: 'long_name'
    };

    // Get the form fields for the specified section (shipping or billing)
    const fields = ADDRESS_COMPONENT_TYPES[section];

    // Reset the values
    for (const component in fields) {
        const field = getAddressInputElement(section, component);
        if (field) field.value = '';
    }

    // Populate the form fields
    for (const component of place.address_components) {
        const addressType = component.types[0];
        if (componentForm[addressType]) {
            const val = component[componentForm[addressType]];
            switch (addressType) {
                case 'street_number':
                    getAddressInputElement(section, 'address').value = val + ' ' + getAddressInputElement(section, 'address').value;
                    break;
                case 'route':
                    getAddressInputElement(section, 'address').value += val;
                    break;
                case 'locality':
                    getAddressInputElement(section, 'city').value = val;
                    break;
                case 'administrative_area_level_1':
                    getAddressInputElement(section, 'state').value = val;
                    break;
                case 'postal_code':
                    getAddressInputElement(section, 'zip').value = val;
                    break;
                case 'country':
                    getAddressInputElement(section, 'country').value = val;
                    break;
            }
        }
    }
}

// Initialize the address autocompletes
function initAddressAutocompletes() {
    if (typeof google === 'object' && typeof google.maps === 'object') {
        // Shipping address autocomplete
        const shippingAddressInput = document.getElementById('address');
        if (shippingAddressInput) {
            const shippingAutocomplete = new google.maps.places.Autocomplete(shippingAddressInput);

            shippingAutocomplete.addListener('place_changed', () => {
                const place = shippingAutocomplete.getPlace();
                if (!place.geometry) {
                    alert(`No details available for input: '${place.name}'`);
                    return;
                }
                fillInAddressFields(place, 'shipping');
            });
        }

        // Billing address autocomplete
        const billingAddressInput = document.getElementById('billingAddress');
        if (billingAddressInput) {
            const billingAutocomplete = new google.maps.places.Autocomplete(billingAddressInput);

            billingAutocomplete.addListener('place_changed', () => {
                const place = billingAutocomplete.getPlace();
                if (!place.geometry) {
                    alert(`No details available for input: '${place.name}'`);
                    return;
                }
                fillInAddressFields(place, 'billing');
            });
        }
    } else {
        console.error('Google Maps JavaScript API not loaded.');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // Initialize the address autocompletes
    initAddressAutocompletes();

    const checkoutForm = document.getElementById('checkoutForm');
    const popupOverlay = document.getElementById('popupOverlay');
    const closePopup = document.getElementById('closePopup');
    const messageDiv = document.getElementById('message');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const shippingMessageDiv = document.getElementById('shippingMessage');
    const paymentMessageDiv = document.getElementById('paymentMessage');
    const discountMessageDiv = document.getElementById('discountMessage');
    const expDateMessage = document.getElementById('expDateMessage');
    // Navbar toggler for mobile view
    const navbarToggler = document.querySelector(".navbar-toggler");
    const navbarCollapse = document.querySelector(".navbar-collapse");


    // Buttons for moving to next sections
    const continueToPaymentBtn = document.getElementById('continueToPayment');
    const continueToReviewBtn = document.getElementById('continueToReview');

    // Order Total (Assuming $50.00 for this example)
    const orderTotal = 50.00;

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

    // Function to show the loading overlay
    function showLoading() {
        loadingOverlay.classList.add('active');
        loadingOverlay.setAttribute('aria-hidden', 'false');
    }

    // Function to hide the loading overlay
    function hideLoading() {
        loadingOverlay.classList.remove('active');
        loadingOverlay.setAttribute('aria-hidden', 'true');
    }

    // Function to display messages and scroll to the message
    const displayMessage = (targetDiv, message, type) => {
        targetDiv.textContent = message;
        targetDiv.className = `message ${type}`;
        targetDiv.style.display = 'block';

        // Scroll to the message so it’s visible
        targetDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    // Function to clear messages
    function clearMessage(targetDiv) {
        targetDiv.textContent = '';
        targetDiv.className = 'message';
        targetDiv.style.display = 'none';
    }

    // New function to validate individual fields
    function validateField(fieldId, messageDiv) {
        const field = document.getElementById(fieldId);
        const label = document.querySelector(`label[for="${fieldId}"]`);
        let fieldValue = field.value.trim();

        // For cardNumber and securityCode, use the original value if available
        if ((field.id === 'cardNumber' || field.id === 'securityCode') && field.getAttribute('data-original-value')) {
            fieldValue = field.getAttribute('data-original-value').trim();
        }

        if (!fieldValue) {
            field.classList.add('invalid');
            addAsteriskForMissingFields(fieldId);
            // Optionally, show a message specific to this field
            // displayMessage(messageDiv, `Please enter ${label.textContent}`, 'error');
        } else {
            // Specific format validations
            if (field.type === 'email' && !validateEmail(fieldValue)) {
                field.classList.add('invalid');
                displayMessage(messageDiv, 'Please enter a valid email address.', 'error');
            } else if (field.type === 'tel' && !validatePhone(fieldValue)) {
                field.classList.add('invalid');
                displayMessage(messageDiv, 'Please enter a valid phone number.', 'error');
            } else if (field.id === 'cardNumber' && !validateCardNumber(fieldValue)) {
                field.classList.add('invalid');
                displayMessage(messageDiv, 'Please enter a valid card number.', 'error');
            } else if (field.id === 'expDate' && !validateExpDate(fieldValue)) {
                field.classList.add('invalid');
                displayMessage(messageDiv, 'Please enter a valid expiration date.', 'error');
            } else {
                // Clear invalid status and remove asterisk if valid
                field.classList.remove('invalid');
                const asterisk = label?.querySelector('.asterisk');
                if (asterisk) {
                    asterisk.remove();
                }
                clearMessage(messageDiv); // Clear any field-specific error messages
            }
        }
    }

    // Enhanced validation function for sections
    function validateSection(requiredFields, messageDiv) {
        let isValid = true;
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const label = document.querySelector(`label[for="${fieldId}"]`);

            let fieldValue = field.value.trim();

            // For cardNumber and securityCode, use the original value if available
            if ((field.id === 'cardNumber' || field.id === 'securityCode') && field.getAttribute('data-original-value')) {
                fieldValue = field.getAttribute('data-original-value').trim();
            }

            if (!fieldValue) {
                field.classList.add('invalid');
                addAsteriskForMissingFields(fieldId);
                isValid = false;
            } else {
                // Specific format validations
                if (field.type === 'email' && !validateEmail(fieldValue)) {
                    field.classList.add('invalid');
                    isValid = false;
                } else if (field.type === 'tel' && !validatePhone(fieldValue)) {
                    field.classList.add('invalid');
                    isValid = false;
                } else if (field.id === 'cardNumber' && !validateCardNumber(fieldValue)) {
                    field.classList.add('invalid');
                    isValid = false;
                } else if (field.id === 'expDate' && !validateExpDate(fieldValue)) {
                    field.classList.add('invalid');
                    isValid = false;
                } else {
                    // Clear invalid status and remove asterisk if valid
                    field.classList.remove('invalid');
                    const asterisk = label?.querySelector('.asterisk');
                    if (asterisk) {
                        asterisk.remove();
                    }
                }
            }
        });

        if (!isValid) {
            displayMessage(messageDiv, 'Please complete all required fields.', 'error');
        } else {
            clearMessage(messageDiv); // Clear the message if validation passes
        }

        return isValid;
    }

    // Utility functions
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function validatePhone(phone) {
        phone = phone.trim();
        const re = /^\(\d{3}\) \d{3}-\d{4}$/;
        return re.test(phone);
    }

    function validateCardNumber(number) {
        const sanitized = number.replace(/\s/g, '');
        const re = /^\d{14,16}$/; // Card number should be 14 to 16 digits
        return re.test(sanitized);
    }

    function validateExpDate(expDate) {
        const [month, year] = expDate.split('/');
        if (!month || !year) return false;
        const monthNum = parseInt(month, 10);
        const yearNum = parseInt(year, 10);
        if (isNaN(monthNum) || isNaN(yearNum)) return false;
        if (monthNum < 1 || monthNum > 12) return false;
        return true;
    }

    // Function to validate the shipping method (radio button)
    function validateShippingMethod() {
        const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked');
        if (!shippingMethod) {
            displayMessage(shippingMessageDiv, 'Please select a shipping method.', 'error');
            return false;
        } else {
            clearMessage(shippingMessageDiv); // Clear the message if validation passes
            return true;
        }
    }

    // Function to collapse current section and open the next
    function collapseSectionWithValidation(currentSectionId, nextSectionId, requiredFields, messageDiv) {
        const isValid = validateSection(requiredFields, messageDiv);

        let isShippingValid = true;
        if (currentSectionId === 'shippingSection') {
            isShippingValid = validateShippingMethod();
        }

        if (isValid && isShippingValid) {
            // Collapse current section
            const currentSection = document.getElementById(currentSectionId);
            if (currentSection) {
                const formContent = currentSection.querySelector('.form-content');
                if (formContent) {
                    formContent.style.display = 'none';
                }
            }

            // Open the next section
            const nextSection = document.getElementById(nextSectionId);
            if (nextSection) {
                const formContent = nextSection.querySelector('.form-content');
                if (formContent) {
                    formContent.style.display = 'block';
                }
            }
        }
    }

    // Section 1: Continue to Payment
    continueToPaymentBtn.addEventListener('click', function () {
        const isSection1Valid = validateSection(requiredFieldsSection1, shippingMessageDiv);

        // Ensure all required fields are valid in Section 1
        if (!isSection1Valid) {
            displayMessage(shippingMessageDiv, 'Please complete all required fields before proceeding to payment.', 'error');
            return;
        }

        // If all validations pass, proceed to Section 2
        collapseSectionWithValidation('shippingSection', 'paymentSection', requiredFieldsSection1, shippingMessageDiv);
    });

    // Section 2: Continue to Review
    continueToReviewBtn.addEventListener('click', function () {
        const isSection2Valid = validateSection(requiredFieldsSection2, paymentMessageDiv);

        // Ensure all required fields, including expiration date, are valid
        if (!isSection2Valid || expDateMessage.textContent) {
            displayMessage(paymentMessageDiv, 'Please correct all errors before proceeding.', 'error');
            return;
        }

        // If all validations pass, proceed to Section 3
        collapseSectionWithValidation('paymentSection', 'reviewOrderSection', requiredFieldsSection2, paymentMessageDiv);
    });

    // Event listeners to clear error messages when user corrects the fields
    function addInputEventListeners(fields, messageDiv) {
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', function () {
                    validateField(fieldId, messageDiv);
                });
            }
        });
    }

    // Add event listeners to required fields
    addInputEventListeners(requiredFieldsSection1, shippingMessageDiv);
    addInputEventListeners(requiredFieldsSection2, paymentMessageDiv);

    // Auto-format phone number as (###) ###-####
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function (e) {
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
    }

    // Auto-format expiration date as MM/YY
    const expDateInput = document.getElementById('expDate');
    if (expDateInput) {
        expDateInput.addEventListener('input', function (e) {
            let input = e.target.value.replace(/\D/g, '');
            if (input.length > 2) {
                input = input.substring(0, 2) + '/' + input.substring(2, 4);
            }
            e.target.value = input;

            // Clear the message if the user hasn't entered both month and year
            if (input.length < 5) {
                expDateMessage.textContent = '';
            }
        });

        // Validate expiration date on blur
        expDateInput.addEventListener('blur', function () {
            const expDateValue = expDateInput.value;

            if (expDateValue.length >= 5) {
                if (!validateExpDate(expDateValue)) {
                    expDateMessage.textContent = 'Invalid date';
                    expDateMessage.style.color = 'red';
                } else if (isCardExpired(expDateValue)) {
                    expDateMessage.textContent = 'Card expired';
                    expDateMessage.style.color = 'red';
                } else {
                    expDateMessage.textContent = '';
                }
            } else {
                expDateMessage.textContent = 'Please enter a complete date (MM/YY)';
                expDateMessage.style.color = 'red';
            }
        });
    }

    // Auto-format card number as #### #### #### ####
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', function (e) {
            let input = e.target.value.replace(/\D/g, '');
            input = input.match(/.{1,4}/g)?.join(' ') || input;
            e.target.value = input;

            // Detect card brand and display it
            const cardBrand = getCardBrand(e.target.value);
            const cardBrandDisplay = document.getElementById('cardBrandDisplay');
            if (cardBrandDisplay) {
                cardBrandDisplay.textContent = cardBrand !== 'Unknown' ? cardBrand : '';
            }
        });
    }

    // Event listener for payment method change
    const paymentMethodInputs = document.querySelectorAll('input[name="paymentMethod"]');
    paymentMethodInputs.forEach(input => {
        input.addEventListener('change', function () {
            handlePaymentMethodChange();
        });
    });

    // Function to handle payment method change
    function handlePaymentMethodChange() {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const creditCardFields = document.getElementById('creditCardFields');
        const klarnaPayment = document.getElementById('klarnaPayment');
        const paypalPayment = document.getElementById('paypalPayment');
        const reviewOrderSection = document.getElementById('reviewOrderSection');

        if (selectedMethod === 'creditCard') {
            if (creditCardFields) creditCardFields.style.display = 'block';
            if (klarnaPayment) klarnaPayment.style.display = 'none';
            if (paypalPayment) paypalPayment.style.display = 'none';
            if (reviewOrderSection) reviewOrderSection.style.display = 'block'; // Show Section 3
        } else if (selectedMethod === 'klarna') {
            if (creditCardFields) creditCardFields.style.display = 'none';
            if (klarnaPayment) klarnaPayment.style.display = 'block';
            if (paypalPayment) paypalPayment.style.display = 'none';
            if (reviewOrderSection) reviewOrderSection.style.display = 'none'; // Hide Section 3
        } else if (selectedMethod === 'paypal') {
            if (creditCardFields) creditCardFields.style.display = 'none';
            if (klarnaPayment) klarnaPayment.style.display = 'none';
            if (paypalPayment) paypalPayment.style.display = 'block';
            if (reviewOrderSection) reviewOrderSection.style.display = 'none'; // Hide Section 3
        }
    }

    // Initialize payment method display
    handlePaymentMethodChange();

    // Event listener for Klarna button
    const klarnaButton = document.getElementById('klarnaButton');
    if (klarnaButton) {
        klarnaButton.addEventListener('click', function () {
            // Implement your Klarna payment integration here
            alert('Redirecting to Klarna payment gateway...');
        });
    }

    // Event listener for PayPal button
    const paypalButton = document.getElementById('paypalButton');
    if (paypalButton) {
        paypalButton.addEventListener('click', function () {
            // Implement your PayPal payment integration here
            alert('Redirecting to PayPal...');
        });
    }

    // Function to determine card brand
    function getCardBrand(number) {
        const sanitized = number.replace(/\D/g, '');

        const patterns = [
            { brand: 'Visa', pattern: /^4[0-9]{0,15}$/ },
            { brand: 'MasterCard', pattern: /^(5[1-5][0-9]{0,14}|2[2-7][0-9]{0,14})$/ },
            { brand: 'American Express', pattern: /^3[47][0-9]{0,13}$/ },
            { brand: 'Discover', pattern: /^6(?:011|5[0-9]{2})[0-9]{0,12}$/ },
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
            const estDateElement = document.getElementById(`${method.toLowerCase()}EstDate`);
            if (estDateElement) {
                estDateElement.textContent = estDateStr;
            }

            // Determine the shipping cost
            let shippingCost = shippingInfo.cost;
            if (method === 'Standard' && orderTotal >= 35.00) {
                shippingCost = 0;
            }

            // Update the shipping cost in the HTML
            const costElement = document.getElementById(`${method.toLowerCase()}Cost`);
            if (costElement) {
                costElement.textContent = `$${shippingCost.toFixed(2)}`;
            }
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
            updateShippingOptions();
            updateOrderSummary();
        });
    });

    // Initialize on page load
    updateShippingOptions();
    updateOrderSummary();

    // Event listener for the "Same as Shipping" checkbox
    const sameAsShippingCheckbox = document.getElementById('sameAsShipping');
    if (sameAsShippingCheckbox) {
        sameAsShippingCheckbox.addEventListener('change', function (e) {
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
    }

    // Validate the expiration date
    const isCardExpired = (expDate) => {
        const today = new Date();
        const [month, year] = expDate.split('/').map(Number);
        if (!month || !year) return true;
        if (month < 1 || month > 12) return true;
        let expYear = year;
        if (year < 100) {
            expYear += 2000; // Convert YY to YYYY
        }
        const exp = new Date(expYear, month - 1, 1); // Month is 0-indexed
        exp.setMonth(exp.getMonth() + 1); // Set to the first day of the next month
        return today >= exp;
    };

    // Function to mask card number and CVV
    function setupSensitiveDataMasking() {
        const cardNumberInput = document.getElementById('cardNumber');
        const cvvInput = document.getElementById('securityCode');

        if (cardNumberInput) {
            // Handle blur event for card number
            cardNumberInput.addEventListener('blur', function () {
                const value = cardNumberInput.value.replace(/\s/g, ''); // Remove spaces
                if (value.length >= 4) {
                    const lastFour = value.slice(-4);
                    const masked = '*'.repeat(value.length - 4) + lastFour;
                    // Format with spaces (e.g., "**** **** **** 1234")
                    const formattedMasked = masked.replace(/(.{4})/g, '$1 ').trim();
                    cardNumberInput.setAttribute('data-original-value', cardNumberInput.value); // Store original value
                    cardNumberInput.value = formattedMasked;
                }
            });

            // Handle focus event for card number
            cardNumberInput.addEventListener('focus', function () {
                const originalValue = cardNumberInput.getAttribute('data-original-value');
                if (originalValue) {
                    cardNumberInput.value = originalValue;
                }
            });
        }

        if (cvvInput) {
            // Handle blur event for CVV
            cvvInput.addEventListener('blur', function () {
                const value = cvvInput.value;
                if (value.length > 0) {
                    const masked = '*'.repeat(value.length);
                    cvvInput.setAttribute('data-original-value', cvvInput.value); // Store original value
                    cvvInput.value = masked;
                }
            });

            // Handle focus event for CVV
            cvvInput.addEventListener('focus', function () {
                const originalValue = cvvInput.getAttribute('data-original-value');
                if (originalValue) {
                    cvvInput.value = originalValue;
                }
            });
        }

        // Restore original values before form submission
        checkoutForm.addEventListener('submit', function (event) {
            // Restore card number
            if (cardNumberInput) {
                const originalCardNumber = cardNumberInput.getAttribute('data-original-value');
                if (originalCardNumber) {
                    cardNumberInput.value = originalCardNumber;
                }
            }

            // Restore CVV
            if (cvvInput) {
                const originalCVV = cvvInput.getAttribute('data-original-value');
                if (originalCVV) {
                    cvvInput.value = originalCVV;
                }
            }
        });
    }

    // Initialize masking functionality
    setupSensitiveDataMasking();

    // Get the test endpoint selection
    const testEndpointSelect = document.getElementById('test-endpoint');

    // Final submission
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Show the loading screen
        showLoading();

        // Disable the 'Place Order' button
        const placeOrderButton = document.getElementById('placeOrderButton');
        placeOrderButton.disabled = true;

        // Clear any previous messages
        clearMessage(messageDiv);

        // Validate payment section before final submission
        const isSection2Valid = validateSection(requiredFieldsSection2, paymentMessageDiv);
        if (!isSection2Valid) {
            hideLoading(); // Ensure loading overlay is hidden on error
            placeOrderButton.disabled = false;
            return;
        }

        // Validate that a test endpoint has been selected
        const testEndpoint = testEndpointSelect ? testEndpointSelect.value : '';
        if (!testEndpoint) {
            displayMessage(messageDiv, 'Error: Please select a mock endpoint for testing.', 'error');
            hideLoading();
            placeOrderButton.disabled = false;
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
            displayMessage(paymentMessageDiv, 'Error: Your card has expired.', 'error');
            hideLoading();
            placeOrderButton.disabled = false;
            return;
        } else {
            clearMessage(paymentMessageDiv);
        }

        // Get the card brand
        const cardBrand = getCardBrand(cardNumber);

        if (cardBrand === 'Unknown') {
            displayMessage(paymentMessageDiv, 'Error: Unknown card brand. Please check your card number.', 'error');
            hideLoading();
            placeOrderButton.disabled = false;
            return;
        } else {
            clearMessage(paymentMessageDiv);
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
            testEndpoint, // Include the selected mock endpoint
        };

        // Include discounts if applied
        const promoCode = document.getElementById('promoCodeInput').value.trim();
        const rewardNumber = document.getElementById('rewardNumberInput').value.trim();

        if (promoCode) {
            orderData.promoCode = promoCode;
        }

        if (rewardNumber) {
            orderData.rewardNumber = rewardNumber;
        }
        try {
            const response = await fetch('https://group8-a70f0e413328.herokuapp.com/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            let result;
            try {
                result = await response.json();
            } catch (parseError) {
                console.error('Error parsing JSON response:', parseError);
                throw new Error('Invalid server response. Please try again later.');
            }

            if (response.ok) {
                window.location.href = `../views/orderConfirmation.html?orderId=${encodeURIComponent(result.orderId)}`;
            } else {
                let errorMessage = 'Unable to complete purchase at this time.';
                if (result.reason) {
                    errorMessage += ` ${result.reason}`;
                }
                errorMessage += ' Please try again.';
                displayMessage(messageDiv, errorMessage, 'error');
            }
        } catch (error) {
            console.error('Error during order submission:', error);
            let errorMessage = error.message || 'Unable to complete order right now due to a connection error. Please try again.';
            displayMessage(messageDiv, errorMessage, 'error');
        } finally {
            hideLoading();
            placeOrderButton.disabled = false;
        }
    });

    // Close popup functionality (if using a popup)
    if (closePopup) {
        closePopup.addEventListener('click', () => {
            popupOverlay.classList.remove('show');
            // Optionally, reset the form after successful submission
            // checkoutForm.reset();
        });
    }

    // Function to toggle sections
    window.toggleSection = function (sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const content = section.querySelector('.form-content');
            if (content) {
                if (content.style.display === 'block' || content.style.display === '') {
                    content.style.display = 'none';
                } else {
                    content.style.display = 'block';
                }
            }
        }
    };

    // JavaScript to toggle mobile navbar
    document.querySelector('.navbar-toggler').addEventListener('click', function () {
        console.log('Navbar toggler clicked'); // Debugging line
        var navbarCollapse = document.querySelector('.navbar-collapse');
        navbarCollapse.classList.toggle('show');
    });

    // Function to handle the toggle of Order Summary Details
    function setupOrderSummaryToggle() {
        const toggleButton = document.getElementById('toggleButton');
        const toggleArrow = toggleButton ? toggleButton.querySelector('.toggle-arrow') : null;
        const orderDetails = document.getElementById('orderSummaryDetails');

        if (!toggleButton || !toggleArrow || !orderDetails) {
            console.warn('Order Summary Toggle elements not found in the DOM.');
            return;
        }

        function toggleOrderDetails() {
            const isHidden = orderDetails.classList.contains('hidden');
            if (isHidden) {
                orderDetails.classList.remove('hidden');
                orderDetails.classList.add('visible');
                toggleArrow.classList.add('rotated');
                toggleButton.setAttribute('aria-expanded', 'true');
            } else {
                orderDetails.classList.remove('visible');
                orderDetails.classList.add('hidden');
                toggleArrow.classList.remove('rotated');
                toggleButton.setAttribute('aria-expanded', 'false');
            }
        }

        // Event listener for click
        toggleButton.addEventListener('click', function (event) {
            event.preventDefault();
            toggleOrderDetails();
        });

        // Enable keyboard accessibility (Enter and Space keys)
        toggleButton.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleOrderDetails();
            }
        });

        // Initialize the section as expanded
        orderDetails.classList.add('visible');
        toggleArrow.classList.add('rotated');
        toggleButton.setAttribute('aria-expanded', 'true');
    }

    // Call the setup function after DOM content is loaded
    setupOrderSummaryToggle();

    // Function to handle the toggle of Discounts Items
    function setupDiscountsToggle() {
        const toggleButtons = document.querySelectorAll('.toggle-discount');

        if (toggleButtons.length === 0) {
            console.warn('No toggle-discount buttons found.');
            return;
        }

        toggleButtons.forEach(button => {
            button.addEventListener('click', function (event) {
                event.preventDefault();
                const discountHeader = event.target.closest('.discount-header');
                if (!discountHeader) {
                    console.warn('Discount header not found.');
                    return;
                }
                const discountType = discountHeader.getAttribute('data-discount');
                const discountContent = document.getElementById(`${discountType}Content`);

                if (!discountContent) {
                    console.warn(`No discount content found for type: ${discountType}`);
                    return;
                }

                const isHidden = discountContent.classList.contains('hidden');

                if (isHidden) {
                    discountContent.classList.remove('hidden');
                    discountContent.classList.add('visible');
                    button.textContent = '-';
                    button.setAttribute('aria-expanded', 'true');
                } else {
                    discountContent.classList.remove('visible');
                    discountContent.classList.add('hidden');
                    button.textContent = '+';
                    button.setAttribute('aria-expanded', 'false');
                }
            });

            // Enable keyboard accessibility
            button.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    button.click();
                }
            });
        });
    }

    // Initialize Discounts Toggle
    setupDiscountsToggle();

    // Function to update the cart badge number
    function updateCartBadge(count) {
        const cartBadge = document.querySelector('.cart-badge');
        if (cartBadge) {
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    // Example Usage:
    // Update the badge to show 1 item
    updateCartBadge(1);

    // Footer section toggles for expandable sections only
    document.querySelectorAll('.footer-section').forEach(section => {
        const header = section.querySelector('h3');
        const content = section.querySelector('ul');
        if (header && content) {
            header.addEventListener('click', () => {
                const isExpanded = section.getAttribute('aria-expanded') === 'true';
                section.setAttribute('aria-expanded', !isExpanded);
                content.style.maxHeight = isExpanded ? '0' : content.scrollHeight + 'px';
                content.style.opacity = isExpanded ? '0' : '1';
            });
        }
    });


    if (navbarToggler && navbarCollapse) {
        navbarToggler.addEventListener('click', function () {
            const isExpanded = navbarToggler.getAttribute('aria-expanded') === 'true';
            navbarToggler.setAttribute('aria-expanded', !isExpanded);
            navbarCollapse.classList.toggle('show');
        });
    }
});
