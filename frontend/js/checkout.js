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

    // Function to display messages
    const displayMessage = (targetDiv, message, type) => {
        targetDiv.textContent = message;
        targetDiv.className = `message ${type}`;
        targetDiv.style.display = 'block';
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

    // Rest of your existing code...

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

    // The rest of your code remains the same...
});
