document.addEventListener('DOMContentLoaded', function () {
    const orderTableBody = document.getElementById('orderTableBody');
    let table;
    const messageDiv = document.getElementById('message'); // Error message div

    // Hide the error message if the div exists
    if (messageDiv) {
        messageDiv.style.display = 'none';
    } else {
        console.error('Element with ID "message" not found.');
    }

    // Initialize Day.js with Plugins
    if (typeof dayjs === 'undefined') {
        console.error('Day.js is not loaded. Please include Day.js and its plugins in your HTML.');
    } else {
        // Extend Day.js with necessary plugins
        dayjs.extend(dayjs_plugin_utc);
        dayjs.extend(dayjs_plugin_timezone);
        dayjs.extend(dayjs_plugin_advancedFormat);
    }

    // Function to format date as "MM/DD/YYYY"
    const formatDate = (dateString) => {
        if (!dateString) return ''; // Handle null or undefined
        const date = dayjs.utc(dateString); // Parse in UTC
        if (!date.isValid()) return ''; // Handle invalid dates
        return date.format('MM/DD/YYYY');
    };
    
    // Function to format date and time as "MM/DD/YYYY hh:mm:ss A"
    const formatDateAndTime = (dateString) => {
        if (!dateString) return ''; // Handle null or undefined
        const date = dayjs(dateString).tz(dayjs.tz.guess()); // Convert to local timezone
        if (!date.isValid()) return ''; // Handle invalid dates
        return date.format('MM/DD/YYYY hh:mm:ss A');
    };

    // Fetch the orders from the backend when the page loads
    fetchOrders();

    // Fetch and display orders
    async function fetchOrders(isRefresh = false) {
        try {
            const response = await fetch('https://group8-a70f0e413328.herokuapp.com/api/orders');

            // Check if the fetch response is successful
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }

            // Parse the JSON response
            const orders = await response.json();

            // Hide the error message if orders are successfully fetched
            if (messageDiv) {
                messageDiv.style.display = 'none'; // Make sure to hide the error message here
            }

            // Refresh table if necessary
            if (isRefresh) {
                if ($.fn.DataTable.isDataTable('#orderTable')) {
                    table.clear().destroy();
                    $('#orderTableBody').empty();
                }
            }

            // If orders array is empty, show the "No orders found" message
            if (orders.length === 0) {
                if (messageDiv) {
                    messageDiv.textContent = 'No orders found.';
                    messageDiv.style.display = 'block';
                }
                return;
            }

            // If orders are found, display them and hide the error message
            if (orders.length > 0 && messageDiv) {
                messageDiv.style.display = 'none'; // Hide the message if orders are present
            }

            // Display orders
            displayOrders(orders);

        } catch (error) {
            console.error('Error fetching orders:', error);

            // Show error message if there's an issue with the fetch
            if (messageDiv) {
                messageDiv.textContent = 'Error fetching orders. Please try again later.';
                messageDiv.style.display = 'block'; // Show error message on fetch failure
            }
        }
    }

    // Initialize DataTables with export buttons, filtering, and column reordering
    function initializeDataTable() {
        table = $('#orderTable').DataTable({
            paging: true,
            lengthMenu: [10, 25, 50, 100],
            searching: true,
            info: true,
            ordering: true, // Enable ordering
            order: [], // Initial no ordering
            pageLength: 10,
            orderCellsTop: true,
            autoWidth: false, // Disable automatic column width calculation
            colReorder: {
                realtime: true, // Enable realtime reordering (drag-and-drop)
            },
            responsive: true, // Enable Responsive extension
            fixedHeader: true, // Enable FixedHeader extension
            dom: '<"row mb-3 align-items-center"<"col-md-6 d-flex align-items-center"fB><"col-md-6 d-flex justify-content-end"l>>' +
                 'rt' +
                 '<"row"<"col-md-6"i><"col-md-6"p>>',
            language: {
                lengthMenu: 'Show _MENU_ entries',
                info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                paginate: {
                    previous: 'Previous',
                    next: 'Next'
                }
            },
            columnDefs: [
                { name: 'Order ID', visible: true,  targets: 0, orderable: true, width: '100px', responsivePriority: 1 },
                { name: 'Customer', visible: true,  targets: 1, orderable: true, width: '150px', responsivePriority: 2 },
                { name: 'Email', visible: true,  targets: 2, orderable: true, width: '200px', responsivePriority: 3 },
                { name: 'Phone Number', visible: false,  targets: 3, orderable: true, width: '150px', responsivePriority: 4 },
                { name: 'Shipping Method', visible: true,  targets: 4, orderable: true, width: '120px', responsivePriority: 5 },
                { name: 'Shipping Address', visible: false, targets: 5, orderable: true, width: '200px', responsivePriority: 6 },
                { name: 'Shipping Unit Number', visible: false, targets: 6, orderable: true, width: '100px', responsivePriority: 7 },
                { name: 'Shipping City', visible: false, targets: 7, orderable: true, width: '120px', responsivePriority: 8 },
                { name: 'Shipping State', visible: false, targets: 8, orderable: true, width: '80px', responsivePriority: 9 },
                { name: 'Shipping Zip', visible: false, targets: 9, orderable: true, width: '80px', responsivePriority: 10 },
                { name: 'Billing Address', visible: false, targets: 10, orderable: true, width: '200px', responsivePriority: 11 },
                { name: 'Billing Unit Number', visible: false, targets: 11, orderable: true, width: '100px', responsivePriority: 12 },
                { name: 'Billing City', visible: false, targets: 12, orderable: true, width: '120px', responsivePriority: 13 },
                { name: 'Billing State', visible: false, targets: 13, orderable: true, width: '80px', responsivePriority: 14 },
                { name: 'Billing Zip', visible: false, targets: 14, orderable: true, width: '80px', responsivePriority: 15 },
                { name: 'Total Amount', visible: true,  targets: 15, orderable: true, width: '120px', responsivePriority: 16 },
                { name: 'Payment Status', visible: true,  targets: 16, orderable: true, width: '120px', responsivePriority: 17 },
                { name: 'Card Last 4', visible: true,  targets: 17, orderable: true, width: '100px', responsivePriority: 18 },
                { name: 'Card Brand', visible: true,  targets: 18, orderable: true, width: '100px', responsivePriority: 19 },
                { name: 'Expiration Date', visible: true,  targets: 19, orderable: true, width: '120px', responsivePriority: 20 },
                {
                    name: 'Order Date/Time',
                    visible: false,
                    targets: 20,
                    orderable: true,
                    type: 'datetime',
                    width: '150px',
                    responsivePriority: 21,
                    render: function(data, type, row) {
                        if (type === 'display' || type === 'filter') {
                            return formatDateAndTime(data);
                        }
                        return data;
                    }
                },
                {
                    name: 'Order Date',
                    visible: true,
                    targets: 21,
                    orderable: true,
                    type: 'date',
                    width: '120px',
                    responsivePriority: 22,
                    render: function(data, type, row) {
                        if (type === 'display' || type === 'filter') {
                            return formatDate(data);
                        }
                        return data;
                    }
                },
                { name: 'Order Time', visible: false,  targets: 22, orderable: true, width: '100px', responsivePriority: 23 },
                { name: 'Authorization Token', visible: true,  targets: 23, orderable: true, width: '150px', responsivePriority: 24 },
                { name: 'Authorization Amount', visible: true,  targets: 24, orderable: true, width: '150px', responsivePriority: 25 },
                {
                    name: 'Authorization Expiration',
                    visible: true,
                    targets: 25,
                    orderable: true,
                    type: 'datetime',
                    width: '150px',
                    responsivePriority: 26,
                    render: function(data, type, row) {
                        if (type === 'display' || type === 'filter') {
                            return formatDateAndTime(data);
                        }
                        return data;
                    }
                },
                { name: 'Warehouse Status', visible: true,  targets: 26, orderable: true, width: '120px', responsivePriority: 27 },
                {
                    name: 'Warehouse Approval Date',
                    visible: true,
                    targets: 27,
                    orderable: true,
                    type: 'datetime',
                    width: '150px',
                    responsivePriority: 28,
                    render: function(data, type, row) {
                        if (type === 'display' || type === 'filter') {
                            return data ? formatDateAndTime(data) : 'N/A';
                        }
                        return data;
                    }
                }
            ],

            buttons: [
                {
                    extend: 'csv',
                    className: 'd-none' // Hide the button
                },
                {
                    extend: 'excel',
                    className: 'd-none' // Hide the button
                },
                {
                    extend: 'pdf',
                    className: 'd-none', // Hide the button
                    orientation: 'landscape', // Landscape mode
                    pageSize: 'LEGAL', // Use LEGAL paper size for more width
                    customize: function (doc) {
                        // Reduce font sizes
                        doc.styles.tableHeader.fontSize = 6;
                        doc.defaultStyle.fontSize = 6;
                
                        // Adjust margins
                        doc.pageMargins = [5, 5, 5, 5]; // left, top, right, bottom
                
                        // Set column widths to auto-fit
                        var colCount = doc.content[1].table.body[0].length;
                        var widths = [];
                        for (i = 0; i < colCount; i++) {
                            widths.push('*');
                        }
                        doc.content[1].table.widths = widths;
                
                        // Adjust cell alignment
                        doc.content[1].table.body.forEach(function(row) {
                            row.forEach(function(cell) {
                                cell.alignment = 'left';
                            });
                        });
                    }
                }
                
            ],
            footerCallback: function (row, data, start, end, display) {
                let totalAmount = 0;
                let totalTransactionAmount = 0;
                const api = this.api();
            
                // Get the indices of the required columns
                const totalAmountIndex = api.column('Total Amount:name').index('visible');
                const authorizationAmountIndex = api.column('Authorization Amount:name').index('visible');
            
                // Loop through displayed rows
                data.forEach(function(rowData) {
                    // Remove dollar signs and commas before parsing
                    const amount = parseFloat(rowData[totalAmountIndex].replace('$', '').replace(/,/g, '')) || 0;
                    const transactionAmount = parseFloat(rowData[authorizationAmountIndex].replace('$', '').replace(/,/g, '')) || 0;
            
                    totalAmount += amount;
                    totalTransactionAmount += transactionAmount;
                });
            
                // Update the footer totals
                $('#totalAmount').text(`$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
                $('#totalTransactionAmount').text(`$${totalTransactionAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
            }
            
        });

            // Initialize dynamic column indices
            updateDynamicColumnIndices();

        // Hook into the draw event to ensure totals are updated after the table is drawn
        table.on('draw', updateTotals);

        // Listen for column reorder events (optional logging)
        table.on('column-reorder', function (e, settings, details) {
            console.log('Columns reordered');
            // Update dynamic column indices
            updateDynamicColumnIndices();
        
            // Adjust table layout
            table.columns.adjust().draw(false);
        });
        

        addColumnFiltering();
    }

    let totalAmountIndex, authorizationAmountIndex;

    function updateDynamicColumnIndices() {
        totalAmountIndex = table.column('Total Amount:name').index('visible');
        authorizationAmountIndex = table.column('Authorization Amount:name').index('visible');
        // Update any other dynamic indices here if needed
    }
    

    // Display orders in the table after initializing DataTable
    function displayOrders(orders) {
        // Hide the error message when orders are successfully displayed
        if (messageDiv) {
            messageDiv.style.display = 'none'; // Ensure error message is hidden
        }

        // Loop through each order and create table rows dynamically
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.OrderID || 'N/A'}</td>                         <!-- index 0: Order ID -->
                <td>${order.FirstName || ''} ${order.LastName || ''}</td> <!-- index 1: Customer -->
                <td>${order.CustomerEmail || 'N/A'}</td>                    <!-- index 2: Email -->
                <td>${order.PhoneNumber || 'N/A'}</td>                      <!-- index 3: Phone Number -->
                <td>${order.ShippingMethod || 'N/A'}</td>                   <!-- index 4: Shipping Method -->
                <td>${order.ShippingAddress || 'N/A'}</td>                  <!-- index 5: Shipping Address -->
                <td>${order.ShippingUnitNumber || ''}</td>                   <!-- index 6: Shipping Unit Number -->
                <td>${order.ShippingCity || 'N/A'}</td>                     <!-- index 7: Shipping City -->
                <td>${order.ShippingState || 'N/A'}</td>                    <!-- index 8: Shipping State -->
                <td>${order.ShippingZip || 'N/A'}</td>                      <!-- index 9: Shipping Zip -->
                <td>${order.BillingAddress || 'N/A'}</td>                   <!-- index 10: Billing Address -->
                <td>${order.BillingUnitNumber || ''}</td>                    <!-- index 11: Billing Unit Number -->
                <td>${order.BillingCity || 'N/A'}</td>                      <!-- index 12: Billing City -->
                <td>${order.BillingState || 'N/A'}</td>                     <!-- index 13: Billing State -->
                <td>${order.BillingZipCode || 'N/A'}</td>                   <!-- index 14: Billing Zip Code -->
                <td>$${order.TotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> <!-- index 15: Total Amount -->
                <td>${order.PaymentStatus || 'N/A'}</td>                    <!-- index 16: Payment Status -->
                <td>**** **** **** ${order.CardNumber || 'N/A'}</td>        <!-- index 17: Card Last 4 -->
                <td>${order.CardBrand || 'N/A'}</td>                        <!-- index 18: Card Brand -->
                <td>${order.ExpirationDate || 'N/A'}</td>                   <!-- index 19: Expiration Date -->
                <td>${order.OrderDateTime || 'N/A'}</td>                    <!-- index 20: Order Date/Time -->
                <td>${order.OrderDate || 'N/A'}</td>                        <!-- index 21: Order Date -->
                <td>${order.OrderTime || 'N/A'}</td>                        <!-- index 22: Order Time -->
                <td>${order.AuthorizationToken || 'N/A'}</td>               <!-- index 23: Authorization Token -->
                <td>$${order.AuthorizationAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> <!-- index 24: Authorization Amount -->
                <td>${order.AuthorizationExpirationDate || 'N/A'}</td>      <!-- index 25: Authorization Expiration -->
                <td>${order.WarehouseStatus || 'N/A'}</td>                  <!-- index 26: Warehouse Status -->
                <td>${order.WarehouseApprovalDate || 'N/A'}</td>            <!-- index 27: Warehouse Approval Date -->
            `;

            orderTableBody.appendChild(row);
        });

        // Initialize DataTable after data is loaded
        initializeDataTable();

        // Adjust and draw the DataTable after loading the data
        table.columns.adjust().draw();
    }
// Add filtering functionality for individual columns
function addColumnFiltering() {
    $('#orderIDFilter').on('keyup', debounce(function () {
        table.column('Order ID:name').search(this.value).draw();
    }, 300));

    $('#customerFilter').on('keyup', debounce(function () {
        table.column('Customer:name').search(this.value).draw();
    }, 300));

    $('#emailFilter').on('keyup', debounce(function () {
        table.column('Email:name').search(this.value).draw();
    }, 300));

    $('#phoneNumberFilter').on('keyup', debounce(function () {
        table.column('Phone Number:name').search(this.value).draw();
    }, 300));

    // Shipping Method is handled via dropdown, so no direct input

    $('#shippingAddressFilter').on('keyup', debounce(function () {
        table.column('Shipping Address:name').search(this.value).draw();
    }, 300));

    $('#shippingUnitNumberFilter').on('keyup', debounce(function () {
        table.column('Shipping Unit Number:name').search(this.value).draw();
    }, 300));

    $('#shippingCityFilter').on('keyup', debounce(function () {
        table.column('Shipping City:name').search(this.value).draw();
    }, 300));

    $('#shippingStateFilter').on('keyup', debounce(function () {
        table.column('Shipping State:name').search(this.value).draw();
    }, 300));

    $('#shippingZipFilter').on('keyup', debounce(function () {
        table.column('Shipping Zip:name').search(this.value).draw();
    }, 300));

    $('#billingAddressFilter').on('keyup', debounce(function () {
        table.column('Billing Address:name').search(this.value).draw();
    }, 300));

    $('#billingUnitNumberFilter').on('keyup', debounce(function () {
        table.column('Billing Unit Number:name').search(this.value).draw();
    }, 300));

    $('#billingCityFilter').on('keyup', debounce(function () {
        table.column('Billing City:name').search(this.value).draw();
    }, 300));

    $('#billingStateFilter').on('keyup', debounce(function () {
        table.column('Billing State:name').search(this.value).draw();
    }, 300));

    $('#billingZipFilter').on('keyup', debounce(function () {
        table.column('Billing Zip:name').search(this.value).draw();
    }, 300));

    $('#totalAmountFilter').on('keyup', debounce(function () {
        table.column('Total Amount:name').search(this.value).draw();
    }, 300));

    // Payment Status is handled via dropdown, so no direct input

    $('#cardNumberFilter').on('keyup', debounce(function () {
        table.column('Card Last 4:name').search(this.value).draw();
    }, 300));

    $('#cardBrandFilter').on('keyup', debounce(function () {
        table.column('Card Brand:name').search(this.value).draw();
    }, 300));

    $('#expirationDateFilter').on('keyup', debounce(function () {
        table.column('Expiration Date:name').search(this.value).draw();
    }, 300));

    // Date filters are handled via custom filtering functions

    $('#orderTimeFilter').on('keyup', debounce(function () {
        table.column('Order Time:name').search(this.value).draw();
    }, 300));

    $('#authTokenFilter').on('keyup', debounce(function () {
        table.column('Authorization Token:name').search(this.value).draw();
    }, 300));

    $('#authAmountFilter').on('keyup', debounce(function () {
        table.column('Authorization Amount:name').search(this.value).draw();
    }, 300));

    // Warehouse Status is handled via dropdown, so no direct input
}


    // Debounce function to limit the rate of function calls
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Clear all filters
    document.getElementById('clearFilters').addEventListener('click', function() {
        // Clear each individual column search filter
        table.columns().search('').draw();

        // Reset the filter input fields (assuming you have inputs for each column)
        document.querySelectorAll('.filter-row input').forEach(input => input.value = '');

        // If you have dropdown filters, reset their states too
        document.querySelectorAll('.dropdown-options input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);

        // If you have dropdown buttons, reset the button text to the default (e.g., "Choose...")
        document.querySelectorAll('.select-button').forEach(button => button.textContent = 'Choose...');

        // Reset datepickers
        $('#orderDateMin, #orderDateMax, #orderDateTimeMin, #orderDateTimeMax, #authExpirationMin, #authExpirationMax, #warehouseApprovalDateMin, #warehouseApprovalDateMax').val('');

        console.log('All filters cleared');
    });

    // Update totals function
    function updateTotals() {
        let totalAmount = 0;
        let totalTransactionAmount = 0;
    
        $('#orderTable tbody tr:visible').each(function () {
            const amountText = $(this).find('td').eq(totalAmountIndex).text().replace('$', '').replace(/,/g, '');
            const transactionAmountText = $(this).find('td').eq(authorizationAmountIndex).text().replace('$', '').replace(/,/g, '');
    
            const amount = parseFloat(amountText) || 0;
            const transactionAmount = parseFloat(transactionAmountText) || 0;
    
            totalAmount += amount;
            totalTransactionAmount += transactionAmount;
        });
    
        // Update the totals in the footer
        $('#totalAmount').text(`$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
        $('#totalTransactionAmount').text(`$${totalTransactionAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    }
    

    // Initialize dropdown filters
    function initializeDropdownFilter(buttonId, optionsId, columnName) {
        const filterButton = document.getElementById(buttonId);
        const filterOptions = document.getElementById(optionsId);
        const checkboxes = filterOptions.querySelectorAll('input[type="checkbox"]');
    
        // Toggle dropdown on button click
        filterButton.addEventListener('click', function (e) {
            e.stopPropagation();
            // Toggle visibility of the dropdown
            filterOptions.style.display = (filterOptions.style.display === 'block') ? 'none' : 'block';
        });
    
        // Hide dropdown when clicking outside
        document.addEventListener('click', function (e) {
            if (!filterOptions.contains(e.target) && e.target !== filterButton) {
                filterOptions.style.display = 'none';
            }
        });
    
        // Handle selection and filtering logic
        filterOptions.addEventListener('click', function (e) {
            if (e.target.tagName === 'INPUT') {
                const selectedOption = e.target.parentNode.getAttribute('data-value');
    
                if (selectedOption === 'selectAll') {
                    // Select all options except "Clear All"
                    checkboxes.forEach(checkbox => {
                        if (checkbox.parentNode.getAttribute('data-value') !== 'clearAll') {
                            checkbox.checked = true;
                        }
                    });
                } else if (selectedOption === 'clearAll') {
                    // Clear all options, including "Select All"
                    checkboxes.forEach(checkbox => {
                        checkbox.checked = false;
                    });
                    filterButton.textContent = 'Choose...'; // Reset button text
                } else {
                    // Deselect "Clear All" and "Select All" if any individual option is checked
                    const selectAllCheckbox = filterOptions.querySelector(`[data-value="selectAll"] input`);
                    const clearAllCheckbox = filterOptions.querySelector(`[data-value="clearAll"] input`);
                    if (selectAllCheckbox && clearAllCheckbox) {
                        selectAllCheckbox.checked = false;
                        clearAllCheckbox.checked = false;
                    }
                }
    
                // Update the table with selected filters
                updateTableFilter(columnName, checkboxes);
    
                // Update the button text to reflect selected filters
                updateFilterButtonText(buttonId, filterOptions);
            }
        });
    }

    // Update the button text based on selected filters
    function updateFilterButtonText(buttonId, filterOptions) {
        const filterButton = document.getElementById(buttonId);
        const checkedOptions = Array.from(filterOptions.querySelectorAll('input[type="checkbox"]:checked'))
            .filter(checkbox => checkbox.parentNode.getAttribute('data-value') !== 'selectAll' && checkbox.parentNode.getAttribute('data-value') !== 'clearAll')
            .map(checkbox => checkbox.parentNode.textContent.trim());

        if (checkedOptions.length === 0) {
            filterButton.textContent = 'Choose...';
        } else if (checkedOptions.length === filterOptions.querySelectorAll('li').length - 2) { // Exclude "Select All" and "Clear All"
            filterButton.textContent = 'All Selected';
        } else {
            filterButton.textContent = `${checkedOptions.length} Selected`;
        }
    }

    // Update the table based on selected filters
    function updateTableFilter(columnName, checkboxes) {
        const selectedValues = [];
    
        checkboxes.forEach(checkbox => {
            if (checkbox.checked && checkbox.parentNode.getAttribute('data-value') !== 'selectAll' && checkbox.parentNode.getAttribute('data-value') !== 'clearAll') {
                selectedValues.push(escapeRegExp(checkbox.parentNode.getAttribute('data-value')));
            }
        });
    
        // Get the current index of the column
        const columnIndex = table.column(`${columnName}:name`).index('visible');
    
        // If no filters are selected, reset the filter
        if (selectedValues.length === 0) {
            table.column(`${columnName}:name`).search('').draw();
        } else {
            // Use a regex to match any of the selected values
            const regex = selectedValues.join('|');
            table.column(`${columnName}:name`).search(regex, true, false).draw();
        }
    }
    

    // Utility function to escape regex special characters
    function escapeRegExp(string) {
        return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
    }

    // Initialize all dropdown filters
    initializeDropdownFilter('shippingMethodFilterButton', 'shippingMethodFilterOptions', 'Shipping Method');
    initializeDropdownFilter('paymentstatusFilterButton', 'paymentstatusFilterOptions', 'Payment Status');
    initializeDropdownFilter('warehouseStatusFilterButton', 'warehouseStatusFilterOptions', 'Warehouse Status');
    
    // Download functionality
    document.getElementById('downloadButton').addEventListener('click', function () {
        $('#downloadModal').modal('show');
    });

    document.getElementById('downloadConfirm').addEventListener('click', function () {
        const format = document.getElementById('downloadFormat').value;
        exportTable(format);
        $('#downloadModal').modal('hide');
    });

    // Export the table in the selected format
    function exportTable(format) {
        console.log("Selected format: " + format);  // Check which format is being selected
        if (format === 'csv') {
            table.button('.buttons-csv').trigger();  // Trigger hidden CSV button
        } else if (format === 'pdf') {
            console.log("PDF export triggered");  // Add a log to ensure the PDF trigger happens
            table.button('.buttons-pdf').trigger();  // Ensure correct PDF button is triggered
        } else if (format === 'excel') {
            table.button('.buttons-excel').trigger(); // Trigger hidden Excel button
        }
    }

    // Refresh table functionality
    document.getElementById('refreshTable').addEventListener('click', function () {
        console.log('Refresh Table button clicked');
        fetchOrders(true); // Refreshes the table data
    });

    // Choose columns Button
    document.getElementById('chooseColumns').addEventListener('click', function () {
        populateColumnChooser(); // Populate the modal
    });

    // Populate column chooser modal
    function populateColumnChooser() {
        const availableColumns = document.getElementById('availableColumns');
        const selectedColumns = document.getElementById('selectedColumns');

        availableColumns.innerHTML = '';
        selectedColumns.innerHTML = '';

        // Populate the columns into the chooser
        table.columns().every(function (index) {
            const columnTitle = this.header().textContent.trim();
            const listItem = `<li class="list-group-item" data-column-index="${index}">${columnTitle}</li>`;

            // Add the columns to the appropriate list based on visibility
            if (this.visible()) {
                selectedColumns.innerHTML += listItem;
            } else {
                availableColumns.innerHTML += listItem;
            }
        });

        // Make both lists sortable and connected
        $('#selectedColumns, #availableColumns').sortable({
            connectWith: '#availableColumns, #selectedColumns',
            placeholder: 'ui-state-highlight'
        }).disableSelection();
    }

    // Update table column visibility and order based on modal selections
    function updateTableColumns() {
        const selectedColumns = document.querySelectorAll('#selectedColumns li');

        // Create an array of selected column indices in the desired order
        const selectedIndices = Array.from(selectedColumns).map(item => parseInt(item.getAttribute('data-column-index')));

        // Create a complete order array: selected columns first, then the rest in their existing order
        const allColumnIndices = [];
        table.columns().every(function(index) {
            allColumnIndices.push(index);
        });

        // Determine hidden columns by excluding selectedIndices
        const hiddenIndices = allColumnIndices.filter(index => !selectedIndices.includes(index));

        // Combine selected and hidden indices to form the complete order array
        const completeOrder = [...selectedIndices, ...hiddenIndices];

        console.log('Selected column indices:', selectedIndices);
        console.log('Hidden column indices:', hiddenIndices);
        console.log('Complete order array:', completeOrder);

        // Apply column visibility based on selection
        table.columns().every(function(index) {
            if (selectedIndices.includes(index)) {
                this.visible(true, false); // Show column without redrawing
            } else {
                this.visible(false, false); // Hide column without redrawing
            }
        });

        // Apply the complete order array to ColReorder
        try {
            table.colReorder.order(completeOrder, true); // Reorder columns and trigger redraw
        } catch (error) {
            console.error("Error applying column order:", error);
        }

        // Adjust columns and redraw the table to ensure alignment
        table.columns.adjust().draw(false);
    }

    // Apply column selections and close modal
    document.getElementById('applyColumns').addEventListener('click', function () {
        try {
            updateTableColumns(); // Update the table based on modal selections
        } catch (error) {
            console.error("Error in updateTableColumns: ", error);
        }

        $('#chooseColumnsModal').modal('hide'); // Close the modal after applying changes

        // Adjust table layout to ensure alignment
        try {
            table.columns.adjust().draw(false); // Adjust and redraw to fix any alignment issues
        } catch (error) {
            console.error("Error adjusting table layout: ", error);
        }

        console.log("Modal hide triggered and columns updated"); // Log for debugging purposes
    });

    // Ensure table headers, footers, and inputs are aligned after column changes
    function ensureAlignment() {
        // Ensure the table aligns columns, header, footer, and input sizes
        table.columns.adjust().draw(false); // Adjust and redraw to fix any alignment issues
    }

    // Custom date filtering functions
    $.fn.dataTable.ext.search.push(
        function(settings, data, dataIndex) {
            var table = new $.fn.dataTable.Api(settings);
    
            // "Order Date" Filtering
            var orderDateIndex = table.column('Order Date:name').index('visible');
            var orderDate = data[orderDateIndex];
    
            var minDate = $('#orderDateMin').val();
            var maxDate = $('#orderDateMax').val();
    
            if (orderDate) {
                var orderDateParsed = dayjs.utc(orderDate, 'MM/DD/YYYY');
    
                if (minDate) {
                    var minDateParsed = dayjs.utc(minDate, 'MM/DD/YYYY');
                    if (!orderDateParsed.isSameOrAfter(minDateParsed, 'day')) {
                        return false;
                    }
                }
    
                if (maxDate) {
                    var maxDateParsed = dayjs.utc(maxDate, 'MM/DD/YYYY');
                    if (!orderDateParsed.isSameOrBefore(maxDateParsed, 'day')) {
                        return false;
                    }
                }
            }
    
            return true;
        }
    );
    
    $.fn.dataTable.ext.search.push(
        function(settings, data, dataIndex) {
            var table = new $.fn.dataTable.Api(settings);
    
            // "Order Date/Time" Filtering
            var orderDateTimeIndex = table.column('Order Date/Time:name').index('visible');
            var orderDateTime = data[orderDateTimeIndex];
    
            var minDateTime = $('#orderDateTimeMin').val();
            var maxDateTime = $('#orderDateTimeMax').val();
    
            if (orderDateTime) {
                var orderDateTimeParsed = dayjs.utc(orderDateTime, 'MM/DD/YYYY hh:mm:ss A');
    
                if (minDateTime) {
                    var minDateTimeParsed = dayjs.utc(minDateTime, 'MM/DD/YYYY hh:mm:ss A');
                    if (!orderDateTimeParsed.isSameOrAfter(minDateTimeParsed)) {
                        return false;
                    }
                }
    
                if (maxDateTime) {
                    var maxDateTimeParsed = dayjs.utc(maxDateTime, 'MM/DD/YYYY hh:mm:ss A');
                    if (!orderDateTimeParsed.isSameOrBefore(maxDateTimeParsed)) {
                        return false;
                    }
                }
            }
    
            return true;
        }
    );
    

// Initialize datepickers
$('#orderDateMin, #orderDateMax, #orderDateTimeMin, #orderDateTimeMax').datepicker({
    dateFormat: 'mm/dd/yy'
});

// Redraw table when date inputs change
$('#orderDateMin, #orderDateMax, #orderDateTimeMin, #orderDateTimeMax').change(function() {
    table.draw();
});

});