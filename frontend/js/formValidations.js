// formValidations.js

// Validation Patterns and Helper Functions
const validationPatterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\(\d{3}\) \d{3}-\d{4}$/,
    cardNumber: /^\d{14,16}$/,
    expDate: /^(0[1-9]|1[0-2])\/\d{2}$/,
};

// Function to validate email
function validateEmail(email) {
    return validationPatterns.email.test(String(email).toLowerCase());
}

// Function to validate phone number
function validatePhone(phone) {
    return validationPatterns.phone.test(phone);
}

// Function to validate card number
function validateCardNumber(number) {
    const sanitized = number.replace(/\s/g, '');
    return validationPatterns.cardNumber.test(sanitized);
}

// Function to validate expiration date
function validateExpDate(expDate) {
    if (!validationPatterns.expDate.test(expDate)) return false;
    const [month, year] = expDate.split('/').map(Number);
    const currentDate = new Date();
    const exp = new Date(`20${year}`, month); // Set to first day of the next month
    return currentDate < exp;
}

// Function to check if card is expired
function isCardExpired(expDate) {
    const [month, year] = expDate.split('/').map(Number);
    const currentDate = new Date();
    const exp = new Date(`20${year}`, month - 1, 1);
    exp.setMonth(exp.getMonth() + 1);
    return currentDate >= exp;
}

// Function to detect card brand
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

// Function to add asterisk for missing fields
function addAsteriskForMissingFields(fieldId) {
    const label = document.querySelector(`label[for="${fieldId}"]`);
    if (label && !label.querySelector('.asterisk')) {
        label.innerHTML += ' <span class="asterisk" style="color: red;">*</span>';
    }
}

// Function to display messages
function displayMessage(targetDiv, message, type) {
    targetDiv.textContent = message;
    targetDiv.className = `message ${type}`;
    targetDiv.style.display = 'block';
    targetDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Function to clear messages
function clearMessage(targetDiv) {
    targetDiv.textContent = '';
    targetDiv.className = 'message';
    targetDiv.style.display = 'none';
}

// Function to validate individual fields
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

// Function to validate a section of the form
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

// Function to add event listeners for validations
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

// Export validation functions
export {
    validateEmail,
    validatePhone,
    validateCardNumber,
    validateExpDate,
    isCardExpired,
    getCardBrand,
    validateField,
    validateSection,
    addInputEventListeners,
    displayMessage,
    clearMessage
};
