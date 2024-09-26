document.addEventListener('DOMContentLoaded', function () {
    const orderTableBody = document.getElementById('orderTableBody');
    let table;
    const messageDiv = document.getElementById('message'); // Error message div

    // Hide the error message initially
    messageDiv.style.display = 'none';

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

            // If no error, hide the error message
            messageDiv.style.display = 'none';

            // Refresh table if necessary
            if (isRefresh) {
                table.clear().destroy();
                orderTableBody.innerHTML = '';
            }

            // If orders array is empty, handle that case (if needed)
            if (orders.length === 0) {
                messageDiv.textContent = 'No orders found.';
                messageDiv.style.display = 'block';
                return;
            }

            // Display orders
            displayOrders(orders);

        } catch (error) {
            console.error('Error fetching orders:', error);

            // Show error message if there's an issue with the fetch
            messageDiv.textContent = 'Error fetching orders. Please try again later.';
            messageDiv.style.display = 'block';
        }
    }

    // Initialize DataTables with export buttons, filtering, and column reordering
    function initializeDataTable() {
        table = $('#orderTable').DataTable({
            paging: true,
            lengthMenu: [10, 25, 50, 100],
            searching: true,
            info: true,
            ordering: true,
            pageLength: 10,
            scrollX: true,
            scrollY: '50vh',
            orderCellsTop: true,
            colReorder: true, // Ensure colReorder is enabled
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
                { name: 'Order ID', targets: 0 },
                { name: 'Customer', targets: 1 },
                { name: 'Email', targets: 2 },
                { name: 'Address', targets: 3 },
                { name: 'Shipping Method', targets: 4 },
                { name: 'Payment Status', targets: 5 },
                { name: 'Amount', targets: 6 },
                { name: 'Card Number', targets: 7 },
                { name: 'Expiration Date', targets: 8 },
                { name: 'Billing Zip', targets: 9 },
                { name: 'Transaction Date', targets: 10 },
                { name: 'Authorization Token', targets: 11 },
                { name: 'Authorization Amount', targets: 12 },
                { name: 'Authorization Expiration', targets: 13 },
                { name: 'Warehouse Status', targets: 14 },
            ],
        });

        // Listen for column reorder events
        table.on('column-reorder', function (e, settings, details) {
            console.log('Columns reordered');
        });

        addColumnFiltering();
        table.on('draw', updateTotals); // Update totals on draw
    }

    // Display orders in the table after initializing DataTable
    function displayOrders(orders) {
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.OrderID}</td>
                <td>${order.FirstName} ${order.LastName}</td>
                <td>${order.CustomerEmail}</td>
                <td>${order.StreetAddress}, ${order.UnitNumber || ''}, ${order.City}, ${order.State}, ${order.ZipCode}</td>
                <td>${order.ShippingMethod}</td>
                <td>${order.PaymentStatus}</td>
                <td>$${order.TotalAmount.toFixed(2)}</td>
                <td>**** **** **** ${order.CardNumber.slice(-4)}</td>
                <td>${order.ExpirationDate}</td>
                <td>${order.BillingZipCode}</td>
                <td>${new Date(order.TransactionDateTime).toLocaleString()}</td>
                <td>${order.AuthorizationToken}</td>
                <td>$${order.AuthorizationAmount.toFixed(2)}</td>
                <td>${new Date(order.AuthorizationExpirationDate).toLocaleString()}</td>
                <td>${order.WarehouseStatus || 'N/A'}</td>
            `;
            orderTableBody.appendChild(row);
        });

        // Initialize DataTable after data is loaded
        initializeDataTable();

        // Adjust and draw the DataTable after loading the data
        table.columns.adjust().draw();
    }

    // Handle custom dropdowns for filters
    function handleCustomDropdown(dropdownButton, dropdownOptions, callback) {
        // Toggle the dropdown visibility
        dropdownButton.addEventListener('click', function (event) {
            event.stopPropagation(); // Prevent event bubbling
            dropdownOptions.style.display = dropdownOptions.style.display === 'block' ? 'none' : 'block';
        });

        // Handle the dropdown item clicks
        dropdownOptions.addEventListener('click', function (event) {
            event.stopPropagation(); // Prevent event bubbling

            const target = event.target.closest('li');
            if (!target) return;

            const checkbox = target.querySelector('input[type="checkbox"]');
            const selectedValue = target.getAttribute('data-value');

            if (selectedValue === 'selectAll') {
                // Select all options except 'Select All' and 'Clear All'
                const options = dropdownOptions.querySelectorAll('li');
                options.forEach(option => {
                    const value = option.getAttribute('data-value');
                    const cb = option.querySelector('input[type="checkbox"]');
                    if (value !== 'selectAll' && value !== 'clearAll') {
                        cb.checked = true;
                    }
                });
                dropdownButton.textContent = 'Filtered...';
                callback(getSelectedValues(dropdownOptions));
            } else if (selectedValue === 'clearAll') {
                // Clear all selections
                const options = dropdownOptions.querySelectorAll('li');
                options.forEach(option => {
                    const cb = option.querySelector('input[type="checkbox"]');
                    cb.checked = false;
                });
                dropdownButton.textContent = 'Choose...';
                callback([]);
            } else {
                // Toggle the checkbox
                checkbox.checked = !checkbox.checked;
                const selectedValues = getSelectedValues(dropdownOptions);
                dropdownButton.textContent = selectedValues.length > 0 ? 'Filtered...' : 'Choose...';
                callback(selectedValues);
            }
        });

        // Hide dropdown if clicked outside
        document.addEventListener('click', function (event) {
            if (!dropdownButton.contains(event.target) && !dropdownOptions.contains(event.target)) {
                dropdownOptions.style.display = 'none';
            }
        });
    }

    // Helper function to get selected values
    function getSelectedValues(dropdownOptions) {
        const selectedValues = [];
        const options = dropdownOptions.querySelectorAll('li');
        options.forEach(option => {
            const value = option.getAttribute('data-value');
            const checkbox = option.querySelector('input[type="checkbox"]');
            if (checkbox.checked && value !== 'selectAll' && value !== 'clearAll') {
                selectedValues.push(value);
            }
        });
        return selectedValues;
    }

    // Callback function to handle dropdown selection
    function onDropdownSelection(selectedValues, columnName) {
        if (selectedValues.length === 0) {
            // No filter applied, reset the search for this column
            table.column(`${columnName}:name`).search('').draw();
        } else {
            // Apply the filter with selected values
            const searchRegex = selectedValues.join('|'); // Create a regex string
            table.column(`${columnName}:name`).search(searchRegex, true, false).draw();
        }
    }

    // Setup dropdown for status filter
    const statusFilterButton = document.getElementById('statusFilterButton');
    const statusFilterOptions = document.getElementById('statusFilterOptions');
    handleCustomDropdown(statusFilterButton, statusFilterOptions, function (selectedValues) {
        onDropdownSelection(selectedValues, 'Payment Status');
    });

    // Setup dropdown for warehouse status filter
    const warehouseStatusFilterButton = document.getElementById('warehouseStatusFilterButton');
    const warehouseStatusFilterOptions = document.getElementById('warehouseStatusFilterOptions');
    handleCustomDropdown(warehouseStatusFilterButton, warehouseStatusFilterOptions, function (selectedValues) {
        onDropdownSelection(selectedValues, 'Warehouse Status');
    });

    // Setup dropdown for shipping method filter
    const shippingMethodFilterButton = document.getElementById('shippingMethodFilterButton');
    const shippingMethodFilterOptions = document.getElementById('shippingMethodFilterOptions');
    handleCustomDropdown(shippingMethodFilterButton, shippingMethodFilterOptions, function (selectedValues) {
        onDropdownSelection(selectedValues, 'Shipping Method');
    });

    // Add filtering functionality for individual columns
    function addColumnFiltering() {
        $('#orderIDFilter').on('keyup', function () {
            table.column('Order ID:name').search(this.value).draw();
        });
        $('#customerFilter').on('keyup', function () {
            table.column('Customer:name').search(this.value).draw();
        });
        $('#emailFilter').on('keyup', function () {
            table.column('Email:name').search(this.value).draw();
        });
        $('#addressFilter').on('keyup', function () {
            table.column('Address:name').search(this.value).draw();
        });
        $('#amountFilter').on('keyup', function () {
            table.column('Amount:name').search(this.value).draw();
        });
        $('#cardNumberFilter').on('keyup', function () {
            table.column('Card Number:name').search(this.value).draw();
        });
        $('#billingZipFilter').on('keyup', function () {
            table.column('Billing Zip:name').search(this.value).draw();
        });
        $('#transactionDateFilter').on('change', function () {
            table.column('Transaction Date:name').search(this.value).draw();
        });
        $('#authTokenFilter').on('keyup', function () {
            table.column('Authorization Token:name').search(this.value).draw();
        });
        $('#authAmountFilter').on('keyup', function () {
            table.column('Authorization Amount:name').search(this.value).draw();
        });
    }

    // Update totals function
    function updateTotals() {
        let totalAmount = 0;
        let totalTransactionAmount = 0;

        $('#orderTable tbody tr').each(function () {
            const amount = parseFloat($(this).find('td').eq(6).text().replace('$', '')) || 0;
            const transactionAmount = parseFloat($(this).find('td').eq(12).text().replace('$', '')) || 0;

            totalAmount += amount;
            totalTransactionAmount += transactionAmount;
        });

        $('#totalAmount').text(`$${totalAmount.toFixed(2)}`);
        $('#totalTransactionAmount').text(`$${totalTransactionAmount.toFixed(2)}`);
    }

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
        if (format === 'csv') {
            table.button('.buttons-csv').trigger();
        } else if (format === 'pdf') {
            table.button('.buttons-pdf').trigger();
        } else if (format === 'excel') {
            table.button('.buttons-excel').trigger();
        }
    }

    // Refresh table functionality
    document.getElementById('refreshTable').addEventListener('click', function () {
        console.log('Refresh Table button clicked');
        fetchOrders(true); // Refreshes the table data
    });

    // Populate column chooser modal
    document.getElementById('chooseColumns').addEventListener('click', function () {
        $('#chooseColumnsModal').modal('show');
        populateColumnChooser(); // Populate the column chooser
    });

    function populateColumnChooser() {
        const availableColumns = document.getElementById('availableColumns');
        const selectedColumns = document.getElementById('selectedColumns');

        availableColumns.innerHTML = '';
        selectedColumns.innerHTML = '';

        // Populate the columns into the chooser
        table.columns().every(function (index) {
            const columnTitle = this.header().textContent.trim();
            const columnWidth = $(this.header()).outerWidth(); // Capture current column width
            const listItem = `<li class="list-group-item" data-column="${index}" style="width:${columnWidth}px;">${columnTitle}</li>`;

            // Add the columns to the appropriate list based on visibility
            if (this.visible()) {
                selectedColumns.innerHTML += listItem;
            } else {
                availableColumns.innerHTML += listItem;
            }
        });

        // Make both lists sortable
        $('#selectedColumns, #availableColumns').sortable({
            connectWith: '#availableColumns, #selectedColumns',
            placeholder: 'ui-state-highlight',
            update: function (event, ui) {
                updateTableColumns();
            }
        }).disableSelection();
    }

    // Function to update table column visibility and order
    function updateTableColumns() {
        const selectedColumns = document.querySelectorAll('#selectedColumns li');
        const availableColumns = document.querySelectorAll('#availableColumns li');

        // Set visibility for the selected columns
        selectedColumns.forEach(item => {
            const columnIdx = parseInt(item.getAttribute('data-column'));
            table.column(columnIdx).visible(true); // Show selected columns
        });

        // Hide columns that were moved to available
        availableColumns.forEach(item => {
            const columnIdx = parseInt(item.getAttribute('data-column'));
            table.column(columnIdx).visible(false); // Hide deselected columns
        });

        // Apply the new column order for the selected columns
        const newOrder = Array.from(selectedColumns).map(item => parseInt(item.getAttribute('data-column')));
        table.colReorder.order(newOrder); // Reorder columns in the table
    }

    // Apply column selections and close modal
    document.getElementById('applyColumns').addEventListener('click', function () {
        $('#chooseColumnsModal').modal('hide'); // Close the modal after applying changes
    });
});
