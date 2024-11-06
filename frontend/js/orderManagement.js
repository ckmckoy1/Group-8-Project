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
            // scrollX: true, // Commented out to test without scrolling
            // scrollY: '50vh', // Commented out to test without scrolling
            orderCellsTop: true,
            autoWidth: true, // Enable auto-width
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
                { name: 'Phone Number', visible: true,  targets: 3, orderable: true, width: '150px', responsivePriority: 4 }, // New Phone Number Column
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
                { name: 'Order Date/Time', visible: true,  targets: 20, orderable: true, type: 'datetime', width: '150px', responsivePriority: 21 },
                { name: 'Order Date', visible: true,  targets: 21, orderable: true, type: 'date', width: '120px', responsivePriority: 22 },
                { name: 'Order Time', visible: true,  targets: 22, orderable: true, width: '100px', responsivePriority: 23 },
                { name: 'Authorization Token', visible: true,  targets: 23, orderable: true, width: '150px', responsivePriority: 24 },
                { name: 'Authorization Amount', visible: true,  targets: 24, orderable: true, width: '150px', responsivePriority: 25 },
                { name: 'Authorization Expiration', visible: true,  targets: 25, orderable: true, type: 'datetime', width: '150px', responsivePriority: 26 },
                { name: 'Warehouse Status', visible: true,  targets: 26, orderable: true, width: '120px', responsivePriority: 27 },
                { name: 'Warehouse Approval Date', visible: true,  targets: 27, orderable: true, type: 'datetime', width: '150px', responsivePriority: 28 }
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
                    className: 'd-none', // Hide the button, but it should still be accessible via JavaScript
                    orientation: 'landscape', // Landscape mode
                    pageSize: 'A4', // Use A4 paper size
                    customize: function (doc) {
                        // Auto-width for each column
                        const totalColumns = doc.content[1].table.body[0].length;
                        doc.content[1].table.widths = Array(totalColumns).fill('*');

                        // Smaller font sizes
                        doc.styles.tableHeader.fontSize = 10;
                        doc.defaultStyle.fontSize = 8;
                    }
                }
            ],
            footerCallback: function (row, data, start, end, display) {
                let totalAmount = 0;
                let totalTransactionAmount = 0;

                // Loop through displayed rows
                data.forEach(function(rowData) {
                    // Remove dollar signs and commas before parsing
                    const amount = parseFloat(rowData[14].replace('$', '').replace(/,/g, '')) || 0;
                    const transactionAmount = parseFloat(rowData[23].replace('$', '').replace(/,/g, '')) || 0;

                    totalAmount += amount;
                    totalTransactionAmount += transactionAmount;
                });

                // Format numbers with commas
                const formattedTotalAmount = totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const formattedTotalTransactionAmount = totalTransactionAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

                // Update the footer totals
                $('#totalAmount').text(`$${formattedTotalAmount}`);
                $('#totalTransactionAmount').text(`$${formattedTotalTransactionAmount}`);
            }
        });

        // Hook into the draw event to ensure totals are updated after the table is drawn
        table.on('draw', updateTotals);

        // Listen for column reorder events (optional logging)
        table.on('column-reorder', function (e, settings, details) {
            console.log('Columns reordered');
        });

        addColumnFiltering();
    }

    // Display orders in the table after initializing DataTable
    function displayOrders(orders) {
        // Hide the error message when orders are successfully displayed
        if (messageDiv) {
            messageDiv.style.display = 'none'; // Ensure error message is hidden
        }
    
        // Function to format date as "MM/DD/YYYY"
        const formatDate = (dateObj) => {
            if (!dateObj || !dateObj["$date"]) return ''; // Handle null or missing $date case
            
            const date = new Date(dateObj["$date"]);
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two digits
            const day = String(date.getDate()).padStart(2, '0');        // Ensure two digits
            const year = date.getFullYear();
            return `${month}/${day}/${year}`;
        };
    
        // Function to format date and time as "MM/DD/YYYY HH:MM:SS AM/PM"
        const formatDateAndTime = (dateObj) => {
            if (!dateObj || !dateObj["$date"]) return ''; // Handle null or missing $date case
    
            const date = new Date(dateObj["$date"]);
            const options = { 
                year: 'numeric', month: '2-digit', day: '2-digit', 
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: true 
            };
            return date.toLocaleString('en-US', options);
        };
    
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
                <td>${formatDateAndTime(order.OrderDateTime)}</td>           <!-- index 20: Order Date/Time -->
                <td>${formatDate(order.OrderDate)}</td>                      <!-- index 21: Order Date -->
                <td>${order.OrderTime || 'N/A'}</td>                        <!-- index 22: Order Time -->
                <td>${order.AuthorizationToken || 'N/A'}</td>               <!-- index 23: Authorization Token -->
                <td>$${order.AuthorizationAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td> <!-- index 24: Authorization Amount -->
                <td>${formatDateAndTime(order.AuthorizationExpirationDate)}</td> <!-- index 25: Authorization Expiration -->
                <td>${order.WarehouseStatus || 'N/A'}</td>                  <!-- index 26: Warehouse Status -->
                <td>${order.WarehouseApprovalDate ? formatDateAndTime(order.WarehouseApprovalDate) : 'N/A'}</td> <!-- index 27: Warehouse Approval Date -->
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
            table.column(0).search(this.value).draw(); // Order ID (column index 0)
        }, 300));
        $('#customerFilter').on('keyup', debounce(function () {
            table.column(1).search(this.value).draw(); // Customer (column index 1)
        }, 300));
        $('#emailFilter').on('keyup', debounce(function () {
            table.column(2).search(this.value).draw(); // Email (column index 2)
        }, 300));
        $('#phoneNumberFilter').on('keyup', debounce(function () { // New Filter Listener
            table.column(3).search(this.value).draw(); // Phone Number (column index 3)
        }, 300));
        $('#shippingMethodFilter').on('keyup', debounce(function () {
            table.column(4).search(this.value).draw(); // Shipping Method (column index 4)
        }, 300));
        $('#shippingAddressFilter').on('keyup', debounce(function () {
            table.column(5).search(this.value).draw(); // Shipping Address (column index 5)
        }, 300));
        $('#shippingUnitNumberFilter').on('keyup', debounce(function () {
            table.column(6).search(this.value).draw(); // Shipping Unit Number (column index 6)
        }, 300));
        $('#shippingCityFilter').on('keyup', debounce(function () {
            table.column(7).search(this.value).draw(); // Shipping City (column index 7)
        }, 300));
        $('#shippingStateFilter').on('keyup', debounce(function () {
            table.column(8).search(this.value).draw(); // Shipping State (column index 8)
        }, 300));
        $('#shippingZipFilter').on('keyup', debounce(function () {
            table.column(9).search(this.value).draw(); // Shipping Zip (column index 9)
        }, 300));
        $('#billingAddressFilter').on('keyup', debounce(function () {
            table.column(10).search(this.value).draw(); // Billing Address (column index 10)
        }, 300));
        $('#billingUnitNumberFilter').on('keyup', debounce(function () {
            table.column(11).search(this.value).draw(); // Billing Unit Number (column index 11)
        }, 300));
        $('#billingCityFilter').on('keyup', debounce(function () {
            table.column(12).search(this.value).draw(); // Billing City (column index 12)
        }, 300));
        $('#billingStateFilter').on('keyup', debounce(function () {
            table.column(13).search(this.value).draw(); // Billing State (column index 13)
        }, 300));
        $('#billingZipFilter').on('keyup', debounce(function () {
            table.column(14).search(this.value).draw(); // Billing Zip (column index 14)
        }, 300));
        $('#totalAmountFilter').on('keyup', debounce(function () { // Updated ID
            table.column(15).search(this.value).draw(); // Total Amount (column index 15)
        }, 300));
        // Payment Status is handled via dropdown, so no direct input
        $('#cardNumberFilter').on('keyup', debounce(function () {
            table.column(16).search(this.value).draw(); // Card Number (column index 16)
        }, 300));
        $('#cardBrandFilter').on('keyup', debounce(function () {
            table.column(17).search(this.value).draw(); // Card Brand (column index 17)
        }, 300));
        $('#expirationDateFilter').on('keyup', debounce(function () {
            table.column(18).search(this.value).draw(); // Expiration Date (column index 18)
        }, 300));
        $('#orderDateTimeFilter').on('change', function () {
            table.column(19).search(this.value).draw(); // Order Date/Time (column index 19)
        });
        $('#orderDateFilter').on('change', function () {
            table.column(20).search(this.value).draw(); // Order Date (column index 20)
        });
        $('#orderTimeFilter').on('keyup', debounce(function () {
            table.column(21).search(this.value).draw(); // Order Time (column index 21)
        }, 300));
        $('#authTokenFilter').on('keyup', debounce(function () {
            table.column(22).search(this.value).draw(); // Authorization Token (column index 22)
        }, 300));
        $('#authAmountFilter').on('keyup', debounce(function () {
            table.column(23).search(this.value).draw(); // Authorization Amount (column index 23)
        }, 300));
        $('#authExpirationFilter').on('change', function () {
            table.column(24).search(this.value).draw(); // Authorization Expiration (column index 24)
        });
        // Warehouse Status is handled via dropdown, so no direct input
        $('#warehouseApprovalDateFilter').on('change', function () {
            table.column(26).search(this.value).draw(); // Warehouse Approval Date (column index 26)
        });
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

        console.log('All filters cleared');
    });

    // Update totals function
    function updateTotals() {
        let totalAmount = 0;
        let totalTransactionAmount = 0;

        $('#orderTable tbody tr').each(function () {
            const amountText = $(this).find('td').eq(14).text().replace('$', '').replace(/,/g, '');
            const transactionAmountText = $(this).find('td').eq(23).text().replace('$', '').replace(/,/g, '');

            const amount = parseFloat(amountText) || 0;
            const transactionAmount = parseFloat(transactionAmountText) || 0;

            totalAmount += amount;
            totalTransactionAmount += transactionAmount;
        });

        // Format numbers with commas
        const formattedTotalAmount = totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const formattedTotalTransactionAmount = totalTransactionAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        $('#totalAmount').text(`$${formattedTotalAmount}`);
        $('#totalTransactionAmount').text(`$${formattedTotalTransactionAmount}`);
    }

    // Initialize dropdown filters
    function initializeDropdownFilter(buttonId, optionsId, columnIndex) {
        const filterButton = document.getElementById(buttonId);
        const filterOptions = document.getElementById(optionsId);
        const checkboxes = filterOptions.querySelectorAll('input[type="checkbox"]');

        // Toggle dropdown on button click
        filterButton.addEventListener('click', function (e) {
            e.stopPropagation();
            // Toggle visibility of the dropdown
            if (filterOptions.style.display === 'block') {
                filterOptions.style.display = 'none';
            } else {
                filterOptions.style.display = 'block';
            }
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
                updateTableFilter(columnIndex, checkboxes);
            }
        });
    }

    // Update the table based on selected filters
    function updateTableFilter(columnIndex, checkboxes) {
        const selectedValues = [];

        checkboxes.forEach(checkbox => {
            if (checkbox.checked && checkbox.parentNode.getAttribute('data-value') !== 'selectAll' && checkbox.parentNode.getAttribute('data-value') !== 'clearAll') {
                selectedValues.push(checkbox.parentNode.getAttribute('data-value'));
            }
        });

        // If no filters are selected, reset the filter
        if (selectedValues.length === 0) {
            table.column(columnIndex).search('').draw();
        } else {
            // Use a regex to match any of the selected values
            const regex = selectedValues.map(value => escapeRegExp(value)).join('|');
            table.column(columnIndex).search(regex, true, false).draw();
        }
    }

    // Utility function to escape regex special characters
    function escapeRegExp(string) {
        return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&');
    }

    // Initialize all dropdown filters
    initializeDropdownFilter('shippingMethodFilterButton', 'shippingMethodFilterOptions', 3);
    initializeDropdownFilter('paymentstatusFilterButton', 'paymentstatusFilterOptions', 15);
    initializeDropdownFilter('warehouseStatusFilterButton', 'warehouseStatusFilterOptions', 25);

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
});
