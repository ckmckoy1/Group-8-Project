// Define the initialization function globally for Google Maps API callback
function initAddressAutocompletes() {
    console.log('Google Maps Autocomplete initialized.');

    // Shipping address autocomplete
    const shippingAddressInput = document.getElementById('address');
    if (shippingAddressInput) {
        const shippingAutocomplete = new google.maps.places.Autocomplete(
            shippingAddressInput,
            { types: ['address'] }
        );

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
        const billingAutocomplete = new google.maps.places.Autocomplete(
            billingAddressInput,
            { types: ['address'] }
        );

        billingAutocomplete.addListener('place_changed', () => {
            const place = billingAutocomplete.getPlace();
            if (!place.geometry) {
                alert(`No details available for input: '${place.name}'`);
                return;
            }
            fillInAddressFields(place, 'billing');
        });
    }
}

// Function to fill in address fields based on the selected place
function fillInAddressFields(place, section) {
    const componentForm = {
        street_number: 'short_name',
        route: 'long_name',
        locality: 'long_name',
        administrative_area_level_1: 'short_name',
        postal_code: 'long_name',
        country: 'long_name'
    };

    const addressComponents = {
        street_number: '',
        route: '',
        locality: '',
        administrative_area_level_1: '',
        postal_code: '',
        country: ''
    };

    place.address_components.forEach(component => {
        const addressType = component.types[0];
        if (componentForm[addressType]) {
            const val = component[componentForm[addressType]];
            addressComponents[addressType] = val;
        }
    });

    // Populate the form fields based on the section
    if (section === 'shipping') {
        document.getElementById('address').value = `${addressComponents.street_number} ${addressComponents.route}`.trim();
        document.getElementById('city').value = addressComponents.locality || '';
        document.getElementById('state').value = addressComponents.administrative_area_level_1 || '';
        document.getElementById('zip').value = addressComponents.postal_code || '';
        // If you have a country field:
        // document.getElementById('country').value = addressComponents.country || '';
    } else if (section === 'billing') {
        document.getElementById('billingAddress').value = `${addressComponents.street_number} ${addressComponents.route}`.trim();
        document.getElementById('billingCity').value = addressComponents.locality || '';
        document.getElementById('billingState').value = addressComponents.administrative_area_level_1 || '';
        document.getElementById('billingZipCode').value = addressComponents.postal_code || '';
        // If you have a billing country field:
        // document.getElementById('billingCountry').value = addressComponents.country || '';
    }
}

// Main script execution after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // ------------------ DOM ELEMENTS ------------------
    const checkoutForm = document.getElementById('checkoutForm');
    const popupOverlay = document.getElementById('popupOverlay');
    const closePopup = document.getElementById('closePopup');
    const messageDiv = document.getElementById('message'); // Ensure this element exists in your HTML
    const loadingOverlay = document.getElementById('loadingOverlay');
    const shippingMessageDiv = document.getElementById('shippingMessage'); // Add this to HTML
    const paymentMessageDiv = document.getElementById('paymentMessage');   // Add this to HTML
    const discountMessageDiv = document.getElementById('discountMessage'); // Already exists

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

    // ------------------ HELPER FUNCTIONS ------------------

    // Function to add asterisk for missing fields
    function addAsteriskForMissingFields(fieldId) {
        const label = document.querySelector(`label[for="${fieldId}"]`);
        if (label && !label.querySelector('.asterisk')) {
            label.innerHTML += ' <span class="asterisk" style="color: red;">*</span>';
        }
    }

    // Function to show the loading overlay
    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.add('active');
            loadingOverlay.setAttribute('aria-hidden', 'false');
        }
    }

    // Function to hide the loading overlay
    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('active');
            loadingOverlay.setAttribute('aria-hidden', 'true');
        }
    }

    // Function to display messages
    const displayMessage = (targetDiv, message, type) => {
        if (targetDiv) {
            targetDiv.textContent = message;
            targetDiv.className = `message ${type}`;
            targetDiv.style.display = 'block';
        }
    };

    // Function to validate email format
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    // Function to validate phone number format (e.g., (123) 456-7890)
    function validatePhone(phone) {
        const re = /^\(\d{3}\) \d{3}-\d{4}$/;
        return re.test(phone);
    }

    // Enhanced validation function
    function validateSection(requiredFields, messageDiv) {
        let isValid = true;
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            const label = document.querySelector(`label[for="${fieldId}"]`);

            if (!field.value.trim()) {
                field.classList.add('invalid');
                addAsteriskForMissingFields(fieldId);
                isValid = false;
            } else {
                // Specific format validations
                if (field.type === 'email' && !validateEmail(field.value)) {
                    field.classList.add('invalid');
                    displayMessage(messageDiv, 'Please enter a valid email address.', 'error');
                    isValid = false;
                } else if (field.type === 'tel' && !validatePhone(field.value)) {
                    field.classList.add('invalid');
                    displayMessage(messageDiv, 'Please enter a valid phone number.', 'error');
                    isValid = false;
                } else {
                    field.classList.remove('invalid');
                    const asterisk = label?.querySelector('.asterisk');
                    if (asterisk) {
                        asterisk.remove();
                    }
                }
            }
        });
        return isValid;
    }

    // Function to validate the shipping method (radio button)
    function validateShippingMethod() {
        const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked');
        if (!shippingMethod) {
            displayMessage(shippingMessageDiv, 'Please select a shipping method.', 'error');
            return false;
        }
        return true;
    }

    // Function to determine card brand
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

    // Function to check if card is expired
    function isCardExpired(expDate) {
        const today = new Date();
        const [month, year] = expDate.split('/').map(Number);
        if (!month || !year) return true;
        const exp = new Date(`20${year}-${month}-01`);
        exp.setMonth(exp.getMonth() + 1); // Set to the first day of the next month
        return today >= exp;
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

    // Function to toggle sections with validation
    function collapseSectionWithValidation(currentSectionId, nextSectionId, requiredFields, messageDiv) {
        const isValid = validateSection(requiredFields, messageDiv);
        const isShippingValid = validateShippingMethod();

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
            // The validate functions already handle messaging
        }
    }

    // Function to handle payment method change
    function handlePaymentMethodChange() {
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value;
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

    // Function to handle discounts toggle
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

    // Function to handle the toggle of Order Summary Details
    function setupOrderSummaryToggle() {
        const toggleButton = document.getElementById('toggleButton'); // Reference to the toggle button
        const toggleArrow = toggleButton ? toggleButton.querySelector('.toggle-arrow') : null; // Reference to the arrow image/SVG within the button
        const orderDetails = document.getElementById('orderSummaryDetails'); // Reference to the order details section

        if (!toggleButton || !toggleArrow || !orderDetails) {
            console.warn('Order Summary Toggle elements not found in the DOM.');
            return;
        }

        function toggleOrderDetails() {
            const isHidden = orderDetails.classList.contains('hidden');
            if (isHidden) {
                orderDetails.classList.remove('hidden');
                orderDetails.classList.add('visible');
                toggleArrow.classList.add('rotated'); // Rotate the arrow via CSS
                toggleButton.setAttribute('aria-expanded', 'true'); // Update accessibility attribute
            } else {
                orderDetails.classList.remove('visible');
                orderDetails.classList.add('hidden');
                toggleArrow.classList.remove('rotated'); // Reset the arrow rotation via CSS
                toggleButton.setAttribute('aria-expanded', 'false'); // Update accessibility attribute
            }
        }

        // Event listener for click
        toggleButton.addEventListener('click', function (event) {
            event.preventDefault(); // Prevent default behavior if any
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
        orderDetails.classList.add('visible'); // Show order details
        toggleArrow.classList.add('rotated'); // Rotate the arrow to indicate expanded state
        toggleButton.setAttribute('aria-expanded', 'true'); // Set accessibility attribute
    }

    // Function to handle cart badge updates
    function updateCartBadge(count) {
        const cartBadge = document.querySelector('.cart-badge');
        if (cartBadge) {
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'flex' : 'none'; // Show badge only if count > 0
        }
    }

    // Function to handle footer section toggles (for mobile)
    function setupFooterToggles() {
        document.querySelectorAll('.footer-section').forEach(section => {
            const header = section.querySelector('h3');
            const content = section.querySelector('ul'); // Assuming the content is a list
            if (header && content) {
                header.addEventListener('click', () => {
                    const isExpanded = section.getAttribute('aria-expanded') === 'true';
                    section.setAttribute('aria-expanded', !isExpanded);
                    content.style.display = isExpanded ? 'none' : 'block';
                });
            }
        });
    }

    // Function to handle navbar toggler for mobile view
    function setupNavbarToggler() {
        const navbarToggler = document.querySelector(".navbar-toggler");
        const navbarCollapse = document.querySelector(".navbar-collapse");

        if (navbarToggler && navbarCollapse) {
            navbarToggler.addEventListener("click", () => {
                const expanded = navbarToggler.getAttribute("aria-expanded") === "true";
                navbarToggler.setAttribute("aria-expanded", !expanded);
                navbarCollapse.classList.toggle("show");
            });
        }
    }

    // Initialize all setups
    function initializeSetups() {
        setupDiscountsToggle();
        setupOrderSummaryToggle();
        setupFooterToggles();
        setupNavbarToggler();
        setupSensitiveDataMasking();
    }

    initializeSetups();

    // ------------------ FORM SUBMISSION ------------------
    checkoutForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Show the loading screen
        showLoading();

        // Validate payment section before final submission
        const isSection2Valid = validateSection(requiredFieldsSection2, paymentMessageDiv);
        if (!isSection2Valid) {
            displayMessage(paymentMessageDiv, 'Please complete all required payment fields.', 'error');
            hideLoading(); // Ensure loading overlay is hidden on error
            return;
        }

        // Collect form data
        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('email').value;
        const phone = document.getElementById('phone').value;
        const address = document.getElementById('address').value;
        const unitNumber = document.getElementById('unitNumber').value;
        const city = document.getElementById('city').value;
        const state = document.getElementById('state').value;
        const zip = document.getElementById('zip').value;
        const shippingMethod = document.querySelector('input[name="shippingMethod"]:checked')?.value;
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
            return;
        }

        // Get the card brand
        const cardBrand = getCardBrand(cardNumber);

        if (cardBrand === 'Unknown') {
            displayMessage(paymentMessageDiv, 'Error: Unknown card brand. Please check your card number.', 'error');
            hideLoading();
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

        // Include discounts if applied
        const promoCode = document.getElementById('promoCodeInput')?.value.trim();
        const rewardNumber = document.getElementById('rewardNumberInput')?.value.trim();

        if (promoCode) {
            orderData.promoCode = promoCode;
        }

        if (rewardNumber) {
            orderData.rewardNumber = rewardNumber;
        }

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
                displayMessage(messageDiv, `Order submitted successfully! Order ID: ${result.orderId}`, 'success');
                popupOverlay.classList.add('show'); // Show success popup
            } else {
                displayMessage(messageDiv, `Error: ${result.message}`, 'error');
            }
        } catch (error) {
            console.error('Error during order submission:', error);
            displayMessage(messageDiv, 'Error: Something went wrong during order submission!', 'error');
        }
        finally {
            // Hide the loading screen regardless of success or failure
            hideLoading();
        }
    });

    // ------------------ POPUP HANDLING ------------------
    if (closePopup) {
        closePopup.addEventListener('click', () => {
            popupOverlay.classList.remove('show');
            // Optionally, reset the form after successful submission
            // checkoutForm.reset();
        });
    }

    // ------------------ CART BADGE UPDATE ------------------
    // Function to update the cart badge number
    function updateCartBadge(count) {
        const cartBadge = document.querySelector('.cart-badge');
        if (cartBadge) {
            cartBadge.textContent = count;
            cartBadge.style.display = count > 0 ? 'flex' : 'none'; // Show badge only if count > 0
        }
    }


    // Update the badge to show 1 item
    updateCartBadge(1);

    // ------------------ ADDRESS AUTOCOMPLETE ------------------
    // Autocomplete is handled globally via the initAddressAutocompletes function
    // No need to call it here since it's set as a callback in the Google Maps script
});

