document.addEventListener('DOMContentLoaded', function () {
    const orderTableBody = document.getElementById('orderTableBody');
    let table;

    // Fetch the orders from the backend when the page loads
    fetchOrders();

    // Fetch and display orders
    async function fetchOrders(isRefresh = false) {
        try {
            const response = await fetch('https://group8-a70f0e413328.herokuapp.com/api/orders');
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
            const orders = await response.json();

            // Hide the error message if data is fetched
            document.getElementById('message').style.display = 'none';

            if (isRefresh) {
                table.clear().destroy();
                orderTableBody.innerHTML = '';
            }

            displayOrders(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            document.getElementById('message').textContent = 'Error fetching orders. Please try again later.';
            document.getElementById('message').style.display = 'block';
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
            dom: '<"row mb-3 align-items-center"<"col-md-6 d-flex align-items-center"lB><"col-md-6 d-flex justify-content-end"f>>' +
            'rt' +
            '<"row"<"col-md-6"i><"col-md-6"p>>', // Ensure 'l', 'i', and 'p' are present
            buttons: [
                { extend: 'csv', className: 'buttons-csv', text: 'CSV' },
                { extend: 'pdf', className: 'buttons-pdf', text: 'PDF' },
                { extend: 'excel', className: 'buttons-excel', text: 'Excel' }
            ],
            language: {
                lengthMenu: 'Show _MENU_ entries',
                info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                paginate: {
                    previous: 'Previous',
                    next: 'Next'
                }
            }
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

        // Adjust and draw the DataTable after loading the data
        table.columns.adjust().draw();
    }

    // Handle custom dropdowns for filters
    function handleCustomDropdown(dropdownButton, dropdownOptions, callback) {
        // Toggle the dropdown visibility
        dropdownButton.addEventListener('click', function () {
            dropdownOptions.style.display = dropdownOptions.style.display === 'block' ? 'none' : 'block';
        });

        // Handle the dropdown item clicks
        dropdownOptions.addEventListener('click', function (event) {
            const selectedValue = event.target.getAttribute('data-value');
            callback(selectedValue);
            dropdownButton.textContent = event.target.textContent;
            dropdownOptions.style.display = 'none'; // Hide dropdown after selection
        });

        // Hide dropdown if clicked outside
        document.addEventListener('click', function (event) {
            if (!dropdownButton.contains(event.target) && !dropdownOptions.contains(event.target)) {
                dropdownOptions.style.display = 'none';
            }
        });
    }

    // Example callback function to handle dropdown selection
    function onDropdownSelection(selectedValue) {
        if (selectedValue === 'selectAll') {
            console.log('Select All options');
        } else if (selectedValue === 'clearAll') {
            console.log('Clear All options');
        } else {
            console.log(`Selected: ${selectedValue}`);
        }
    }

// Setup dropdown for status filter
const statusFilterButton = document.getElementById('statusFilterButton');
const statusFilterOptions = document.getElementById('statusFilterOptions');
handleCustomDropdown(statusFilterButton, statusFilterOptions, onDropdownSelection);

// Setup dropdown for warehouse status filter
const warehouseStatusFilterButton = document.getElementById('warehouseStatusFilterButton');
const warehouseStatusFilterOptions = document.getElementById('warehouseStatusFilterOptions');
handleCustomDropdown(warehouseStatusFilterButton, warehouseStatusFilterOptions, onDropdownSelection);

// Setup dropdown for shipping method filter
const shippingMethodFilterButton = document.getElementById('shippingMethodFilterButton');
const shippingMethodFilterOptions = document.getElementById('shippingMethodFilterOptions');
handleCustomDropdown(shippingMethodFilterButton, shippingMethodFilterOptions, onDropdownSelection);

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
        $('#shippingMethodFilter').on('change', function () {
            table.column('Shipping Method:name').search(this.value).draw();
        });
        $('#statusFilter').on('change', function () {
            table.column('Payment Status:name').search(this.value).draw();
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
        $('#warehouseStatusFilter').on('change', function () {
            table.column('Warehouse Status:name').search(this.value).draw();
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

    // Call updateTotals after loading data
    updateTotals();

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
        populateColumnChooser(); // Ensure this function populates the column chooser
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

        // Make the columns draggable
        $('#selectedColumns').sortable({
            placeholder: 'ui-state-highlight',
            axis: 'y',
            update: function (event, ui) {
                const newOrder = $(this).sortable('toArray', { attribute: 'data-column' });
                table.colReorder.order(newOrder);
            }
        }).disableSelection();
    }

    // Apply column selections from modal
    document.getElementById('applyColumns').addEventListener('click', function () {
        const selectedColumns = document.querySelectorAll('#selectedColumns li');
        const newOrder = Array.from(selectedColumns).map(item => parseInt(item.getAttribute('data-column')));

        // Apply the new column order
        table.colReorder.order(newOrder);

        // Set visibility for the columns
        selectedColumns.forEach(item => {
            const columnIdx = parseInt(item.getAttribute('data-column'));
            table.column(columnIdx).visible(true); // Show selected columns
        });

        // Hide unselected columns
        document.querySelectorAll('#availableColumns li').forEach(item => {
            const columnIdx = parseInt(item.getAttribute('data-column'));
            table.column(columnIdx).visible(false); // Hide deselected columns
        });

        $('#chooseColumnsModal').modal('hide'); // Close the modal
    });
});
