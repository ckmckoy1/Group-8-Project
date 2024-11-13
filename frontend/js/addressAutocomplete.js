// addressAutocomplete.js

// Address Component Types
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
        country: 'billingCountry'
    }
};

// Function to get the address input element by section and component type
function getAddressInputElement(section, componentType) {
    return document.getElementById(ADDRESS_COMPONENT_TYPES[section][componentType]);
}

// Function to fill in address fields based on the Google Place object
function fillInAddressFields(place, section) {
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

// Export the initialization function for use in other modules
export { initAddressAutocompletes };
