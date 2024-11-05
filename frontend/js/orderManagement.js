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
                table.clear().destroy();
                orderTableBody.innerHTML = '';
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
            scrollX: true,
            scrollY: '50vh',
            orderCellsTop: true,
            autoWidth: false, // Disable auto-width calculation to prevent misalignment
            colReorder: {
                realtime: true, // Enable realtime reordering (drag-and-drop)
            },
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
                { name: 'Order ID', targets: 0, orderable: true },
                { name: 'Customer', targets: 1, orderable: true },
                { name: 'Email', targets: 2, orderable: true },
                { name: 'Shipping Method', targets: 3, orderable: true },
                { name: 'Shipping Address', targets: 4, orderable: true },
                { name: 'Shipping Unit Number', targets: 5, orderable: true },
                { name: 'Shipping City', targets: 6, orderable: true },
                { name: 'Shipping State', targets: 7, orderable: true },
                { name: 'Shipping Zip', targets: 8, orderable: true },
                { name: 'Billing Address', targets: 9, orderable: true },
                { name: 'Billing Unit Number', targets: 10, orderable: true },
                { name: 'Billing City', targets: 11, orderable: true },
                { name: 'Billing State', targets: 12, orderable: true },
                { name: 'Billing Zip', targets: 13, orderable: true },
                { name: 'Total Amount', targets: 14, orderable: true },
                { name: 'Payment Status', targets: 15, orderable: true },
                { name: 'Card Number', targets: 16, orderable: true },
                { name: 'Card Brand', targets: 17, orderable: true },
                { name: 'Expiration Date', targets: 18, orderable: true },
                { name: 'Order Date Time', targets: 19, orderable: true, type: 'datetime' },
                { name: 'Order Date', targets: 20, orderable: true, type: 'date' },
                { name: 'Order Time', targets: 21, orderable: true },
                { name: 'Authorization Token', targets: 22, orderable: true },
                { name: 'Authorization Amount', targets: 23, orderable: true },
                { name: 'Authorization Expiration', targets: 24, orderable: true, type: 'datetime' },
                { name: 'Warehouse Status', targets: 25, orderable: true },
                { name: 'Warehouse Approval Date', targets: 26, orderable: true, type: 'datetime' }
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

        // Listen for column reorder events
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
                <td>${order.OrderID}</td>                         <!-- index 0 -->
                <td>${order.FirstName} ${order.LastName}</td>      <!-- index 1 -->
                <td>${order.CustomerEmail}</td>                    <!-- index 2 -->
                <td>${order.ShippingMethod}</td>                   <!-- index 3 -->
                <td>${order.ShippingAddress}</td>                  <!-- index 4 -->
                <td>${order.ShippingUnitNumber || ''}</td>         <!-- index 5 -->
                <td>${order.ShippingCity}</td>                     <!-- index 6 -->
                <td>${order.ShippingState}</td>                    <!-- index 7 -->
                <td>${order.ShippingZip}</td>                      <!-- index 8 -->
                <td>${order.BillingAddress}</td>                   <!-- index 9 -->
                <td>${order.BillingUnitNumber || ''}</td>          <!-- index 10 -->
                <td>${order.BillingCity}</td>                      <!-- index 11 -->
                <td>${order.BillingState}</td>                     <!-- index 12 -->
                <td>${order.BillingZipCode}</td>                   <!-- index 13 -->
                <td>$${order.TotalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>          <!-- index 14 -->
                <td>${order.PaymentStatus}</td>                    <!-- index 15 -->
                <td>**** **** **** ${order.CardNumber}</td>        <!-- index 16 -->
                <td>${order.CardBrand}</td>                        <!-- index 17 -->
                <td>${order.ExpirationDate}</td>                   <!-- index 18 -->
                <td>${formatDateAndTime(order.OrderDateTime)}</td> <!-- index 19, updated to handle $date format -->
                <td>${formatDate(order.OrderDate)}</td>             <!-- index 20, updated to handle $date format -->
                <td>${order.OrderTime}</td>                        <!-- index 21 -->
                <td>${order.AuthorizationToken}</td>               <!-- index 22 -->
                <td>$${order.AuthorizationAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>  <!-- index 23 -->
                <td>${formatDateAndTime(order.AuthorizationExpirationDate)}</td> <!-- index 24, updated to handle $date format -->
                <td>${order.WarehouseStatus || 'N/A'}</td>         <!-- index 25 -->
                <td>${order.WarehouseApprovalDate ? formatDateAndTime(order.WarehouseApprovalDate) : 'N/A'}</td> <!-- index 26 -->
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
        $('#orderIDFilter').on('keyup', function () {
            table.column(0).search(this.value).draw(); // Order ID (column index 0)
        });
        $('#customerFilter').on('keyup', function () {
            table.column(1).search(this.value).draw(); // Customer (column index 1)
        });
        $('#emailFilter').on('keyup', function () {
            table.column(2).search(this.value).draw(); // Email (column index 2)
        });
        $('#shippingAddressFilter').on('keyup', function () {
            table.column(4).search(this.value).draw(); // Shipping Address (column index 4)
        });
        $('#shippingUnitNumberFilter').on('keyup', function () {
            table.column(5).search(this.value).draw(); // Shipping Unit Number (column index 5) - Updated label
        });
        $('#shippingCityFilter').on('keyup', function () {
            table.column(6).search(this.value).draw(); // Shipping City (column index 6)
        });
        $('#shippingStateFilter').on('keyup', function () {
            table.column(7).search(this.value).draw(); // Shipping State (column index 7)
        });
        $('#shippingZipFilter').on('keyup', function () {
            table.column(8).search(this.value).draw(); // Shipping Zip (column index 8)
        });
        $('#billingAddressFilter').on('keyup', function () {
            table.column(9).search(this.value).draw(); // Billing Address (column index 9)
        });
        $('#billingUnitNumberFilter').on('keyup', function () {
            table.column(10).search(this.value).draw(); // Billing Unit Number (column index 10) - Added
        });
        $('#billingCityFilter').on('keyup', function () {
            table.column(11).search(this.value).draw(); // Billing City (column index 11)
        });
        $('#billingStateFilter').on('keyup', function () {
            table.column(12).search(this.value).draw(); // Billing State (column index 12)
        });
        $('#billingZipFilter').on('keyup', function () {
            table.column(13).search(this.value).draw(); // Billing Zip (column index 13)
        });
        $('#amountFilter').on('keyup', function () {
            table.column(14).search(this.value).draw(); // Total Amount (column index 14)
        });
        $('#cardNumberFilter').on('keyup', function () {
            table.column(16).search(this.value).draw(); // Card Number (column index 16)
        });
        $('#OrderDateFilter').on('change', function () {
            table.column(19).search(this.value).draw(); // Order Date (column index 19)
        });
        $('#authTokenFilter').on('keyup', function () {
            table.column(22).search(this.value).draw(); // Authorization Token (column index 22)
        });
        $('#authAmountFilter').on('keyup', function () {
            table.column(23).search(this.value).draw(); // Authorization Amount (column index 23)
        });
        $('#warehouseApprovalDateFilter').on('change', function () {
            table.column(26).search(this.value).draw(); // Warehouse Approval Date (column index 26)
        });
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

    function initializeDropdownFilter(buttonId, optionsId, columnIndex) {
        const filterButton = document.getElementById(buttonId);
        const filterOptions = document.getElementById(optionsId);
        const checkboxes = filterOptions.querySelectorAll('input[type="checkbox"]');

        // Toggle dropdown on button click
        filterButton.addEventListener('click', function (e) {
            e.stopPropagation();
            filterOptions.style.display = filterOptions.style.display === 'none' ? 'block' : 'none';
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', function () {
            filterOptions.style.display = 'none';
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
            const regex = selectedValues.join('|');
            table.column(columnIndex).search(regex, true, false).draw();
        }
    }

    // Initialize all dropdown filters
    initializeDropdownFilter('shippingMethodFilterButton', 'shippingMethodFilterOptions', 3);
    initializeDropdownFilter('paymentstatusFilterButton', 'paymentstatusFilterOptions', 14);
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

    // Update table column visibility and order
    function updateTableColumns() {
        const selectedColumns = document.querySelectorAll('#selectedColumns li');

        // First, hide all columns
        table.columns().visible(false, false);

        // Collect the new order based on selected columns
        const newOrder = [];

        // Show selected columns and determine new order
        selectedColumns.forEach(item => {
            const columnIdx = parseInt(item.getAttribute('data-column-index'));
            table.column(columnIdx).visible(true, false); // Show the column without redrawing
            newOrder.push(columnIdx); // Add to new order array
        });

        // Reorder the columns based on newOrder
        table.colReorder.order(newOrder, true); // Trigger a redraw

        // Ensure proper alignment by adjusting the columns, headers, and footers
        table.columns.adjust().draw(false); // Adjust without full redraw for performance
    }

    // Apply column selections and close modal
    document.getElementById('applyColumns').addEventListener('click', function () {
        try {
            updateTableColumns(); // Update the table based on modal selections
        } catch (error) {
            console.error("Error in updateTableColumns: ", error);
        }
        
        $('#chooseColumnsModal').modal('hide'); // Close the modal after applying changes

        // Ensuring the table remains properly aligned after columns are updated
        try {
            ensureAlignment(); // Ensure alignment after columns are applied
        } catch (error) {
            console.error("Error in ensureAlignment: ", error);
        }

        console.log("Modal hide triggered and columns updated"); // Log for debugging purposes
    });

    // Initialize the modal with columns when the "Choose Columns" button is clicked
    document.getElementById('chooseColumns').addEventListener('click', function () {
        populateColumnChooser(); // Populate the modal with available and selected columns
    });

    // Ensure table headers, footers, and inputs are aligned after column changes
    function ensureAlignment() {
        // Ensure the table aligns columns, header, footer, and input sizes
        table.columns.adjust().draw(false); // Adjust and redraw to fix any alignment issues
    }
});
