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

    // Display orders in the table
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

        initializeDataTable();
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
            colReorder: true, // Enable column reordering
            columns: [
                { name: 'Order ID' },
                { name: 'Customer' },
                { name: 'Email' },
                { name: 'Address' },
                { name: 'Shipping Method' },
                { name: 'Payment Status' },
                { name: 'Amount' },
                { name: 'Card Number' },
                { name: 'Expiration Date' },
                { name: 'Billing Zip' },
                { name: 'Transaction Date' },
                { name: 'Authorization Token' },
                { name: 'Authorization Amount' },
                { name: 'Authorization Expiration' },
                { name: 'Warehouse Status' }
            ], // Ensure column names are defined
            dom: '<"row mb-3 align-items-center"<"col-md-6 d-flex align-items-center"lB><"col-md-6 d-flex justify-content-end"f>>' +
                'rt' +
                '<"row"<"col-md-6"i><"col-md-6"p>>',
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

        addColumnFiltering();
        table.on('draw', updateTotals); // Update totals after each table draw
    }

    // Add filtering functionality for individual columns
    function addColumnFiltering() {
        // Filter logic using dynamic column names
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

    // Column chooser functionality
    function populateColumnChooser() {
        const availableColumns = document.getElementById('availableColumns');
        const selectedColumns = document.getElementById('selectedColumns');

        availableColumns.innerHTML = '';
        selectedColumns.innerHTML = '';

        table.columns().every(function (index) {
            const columnTitle = this.header().textContent.trim();
            const columnWidth = $(this.header()).outerWidth(); // Capture current column width
            const listItem = `<li class="list-group-item" data-column="${index}" style="width:${columnWidth}px;">${columnTitle}</li>`;

            if (this.visible()) {
                selectedColumns.innerHTML += listItem;
            } else {
                availableColumns.innerHTML += listItem;
            }
        });

        setupColumnListEvents();

        // Enable dragging and reordering of columns in the modal
        $('#selectedColumns').sortable({
            placeholder: 'ui-state-highlight',
            axis: 'y',
            update: function (event, ui) {
                const newOrder = $(this).sortable('toArray', { attribute: 'data-column' });
                table.colReorder.order(newOrder);
            }
        }).disableSelection();
    }

    // Apply chosen columns
    document.getElementById('applyColumns').addEventListener('click', function () {
        const selectedColumns = document.querySelectorAll('#selectedColumns li');
        const newOrder = Array.from(selectedColumns).map(item => parseInt(item.getAttribute('data-column')));

        // Apply new column order and visibility
        table.colReorder.order(newOrder);

        selectedColumns.forEach(item => {
            const columnIdx = parseInt(item.getAttribute('data-column'));
            table.column(columnIdx).visible(true);
        });

        // Hide the columns not selected
        document.querySelectorAll('#availableColumns li').forEach(item => {
            const columnIdx = parseInt(item.getAttribute('data-column'));
            table.column(columnIdx).visible(false);
        });

        // Close the modal
        $('#chooseColumnsModal').modal('hide');
    });

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

    document.addEventListener('DOMContentLoaded', function () {
        const shippingMethodFilter = document.getElementById('shippingMethodFilter');
    
        // Function to handle select and clear all logic
        shippingMethodFilter.addEventListener('change', function () {
            const selectedValues = Array.from(shippingMethodFilter.selectedOptions).map(option => option.value);
    
            if (selectedValues.includes('selectAll')) {
                // Select all options except the 'Select All' and 'Clear All'
                Array.from(shippingMethodFilter.options).forEach(option => {
                    if (option.value !== 'selectAll' && option.value !== 'clearAll') {
                        option.selected = true;
                    }
                });
            } else if (selectedValues.includes('clearAll')) {
                // Deselect all options
                shippingMethodFilter.selectedIndex = -1; // Clears all selections
            }
        });
    });
    
    document.addEventListener('DOMContentLoaded', function () {
        const statusFilter = document.getElementById('statusFilter');
        const warehouseStatusFilter = document.getElementById('warehouseStatusFilter');
    
        // Function to handle Select All and Clear All for status filter
        statusFilter.addEventListener('change', function () {
            const selectedValues = Array.from(statusFilter.selectedOptions).map(option => option.value);
    
            if (selectedValues.includes('selectAll')) {
                // Select all options except 'Select All' and 'Clear All'
                Array.from(statusFilter.options).forEach(option => {
                    if (option.value !== 'selectAll' && option.value !== 'clearAll') {
                        option.selected = true;
                    }
                });
            } else if (selectedValues.includes('clearAll')) {
                // Deselect all options
                statusFilter.selectedIndex = -1; // Clears all selections
            }
        });
    
        // Function to handle Select All and Clear All for warehouse status filter
        warehouseStatusFilter.addEventListener('change', function () {
            const selectedValues = Array.from(warehouseStatusFilter.selectedOptions).map(option => option.value);
    
            if (selectedValues.includes('selectAll')) {
                // Select all options except 'Select All' and 'Clear All'
                Array.from(warehouseStatusFilter.options).forEach(option => {
                    if (option.value !== 'selectAll' && option.value !== 'clearAll') {
                        option.selected = true;
                    }
                });
            } else if (selectedValues.includes('clearAll')) {
                // Deselect all options
                warehouseStatusFilter.selectedIndex = -1; // Clears all selections
            }
        });
    });
    
});
