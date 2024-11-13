// checkoutProcess.js

import { 
    validateSection, 
    displayMessage, 
    clearMessage, 
    isCardExpired, 
    getCardBrand 
} from './formValidations.js';

// Initialize address autocompletes
import { initAddressAutocompletes } from './addressAutocomplete.js';
initAddressAutocompletes();

// Event Listener for DOM Content Loaded
document.addEventListener('DOMContentLoaded', function () {
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

    // Function to validate shipping method
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

    // Function to handle collapsing and opening sections with validation
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
        } else {
            // Scroll to the message if validation fails
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    // Event listeners for navigation buttons
    continueToPaymentBtn.addEventListener('click', function () {
        const isSection1Valid = validateSection(requiredFieldsSection1, shippingMessageDiv);
        if (!isSection1Valid) {
            displayMessage(shippingMessageDiv, 'Please complete all required fields before proceeding to payment.', 'error');
            return;
        }
        collapseSectionWithValidation('shippingSection', 'paymentSection', requiredFieldsSection1, shippingMessageDiv);
    });

    continueToReviewBtn.addEventListener('click', function () {
        const isSection2Valid = validateSection(requiredFieldsSection2, paymentMessageDiv);
        if (!isSection2Valid || expDateMessage.textContent) {
            displayMessage(paymentMessageDiv, 'Please correct all errors before proceeding.', 'error');
            return;
        }
        collapseSectionWithValidation('paymentSection', 'reviewOrderSection', requiredFieldsSection2, paymentMessageDiv);
    });

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
        const testEndpointSelect = document.getElementById('test-endpoint');
        const testEndpoint = testEndpointSelect ? testEndpointSelect.value : '';
        if (!testEndpoint) {
            displayMessage(messageDiv, 'Error: Please select a mock endpoint for testing.', 'error');
            hideLoading();
            placeOrderButton.disabled = false;
            return;
        }

        // Collect form data
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            shippingAddress: {
                address: document.getElementById('address').value.trim(),
                unitNumber: document.getElementById('unitNumber').value.trim(),
                city: document.getElementById('city').value.trim(),
                state: document.getElementById('state').value.trim(),
                zip: document.getElementById('zip').value.trim(),
            },
            shippingMethod: document.querySelector('input[name="shippingMethod"]:checked').value,
            billingAddress: {
                address: document.getElementById('billingAddress').value.trim(),
                unitNumber: document.getElementById('billingUnitNumber').value.trim(),
                city: document.getElementById('billingCity').value.trim(),
                state: document.getElementById('billingState').value.trim(),
                zipCode: document.getElementById('billingZipCode').value.trim(),
            },
            paymentDetails: {
                cardNumber: document.getElementById('cardNumber').value.replace(/\s/g, ''),
                expDate: document.getElementById('expDate').value.trim(),
                cvv: document.getElementById('securityCode').value.trim(),
                cardHolderName: document.getElementById('billingName').value.trim(),
                cardBrand: getCardBrand(document.getElementById('cardNumber').value),
            },
            orderTotal: orderTotal,
            testEndpoint: testEndpoint, // Include the selected mock endpoint
        };

        // Include discounts if applied
        const promoCode = document.getElementById('promoCodeInput').value.trim();
        const rewardNumber = document.getElementById('rewardNumberInput').value.trim();

        if (promoCode) {
            formData.promoCode = promoCode;
        }

        if (rewardNumber) {
            formData.rewardNumber = rewardNumber;
        }

        try {
            const response = await fetch('https://group8-a70f0e413328.herokuapp.com/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
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
    navbarToggler.addEventListener('click', function () {
        console.log('Navbar toggler clicked'); // Debugging line
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
});
