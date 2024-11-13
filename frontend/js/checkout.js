// checkout.js

// Main Entry Point

import { initAddressAutocompletes } from './addressAutocomplete.js';
import { 
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
} from './formValidations.js';
import './checkoutProcess.js'; // This file handles the main checkout logic

// Initialize all functionalities if needed
initAddressAutocompletes();
