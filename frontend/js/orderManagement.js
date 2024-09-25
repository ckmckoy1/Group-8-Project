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

            // Hide the error message if the data is successfully fetched
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

    // Initialize DataTables with export buttons and individual column filtering
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
            ], // Add column names
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

        // Apply filtering and update totals after each draw
        addColumnFiltering();
        table.on('draw', updateTotals); // Update totals after each draw
    }

    // Add filtering functionality for individual columns
    function addColumnFiltering() {
        $('#orderIDFilter').on('keyup', function () {
            var index = table.column('Order ID:name').index();
            table.column(index).search($.trim(this.value)).draw();
        });

        $('#customerFilter').on('keyup', function () {
            var index = table.column('Customer:name').index();
            table.column(index).search($.trim(this.value)).draw();
        });

        $('#emailFilter').on('keyup', function () {
            var index = table.column('Email:name').index();
            table.column(index).search($.trim(this.value)).draw();
        });

        $('#addressFilter').on('keyup', function () {
            var index = table.column('Address:name').index();
            table.column(index).search($.trim(this.value)).draw();
        });

        $('#shippingMethodFilter').on('change', function () {
            var index = table.column('Shipping Method:name').index();
            table.column(index).search($.trim(this.value)).draw();
        });

        $('#statusFilter').on('change', function () {
            var index = table.column('Payment Status:name').index();
            table.column(index).search($.trim(this.value)).draw();
        });

        $('#amountFilter').on('keyup', function () {
            var index = table.column('Amount:name').index();
            table.column(index).search($.trim(this.value)).draw();
        });

        $('#cardNumberFilter').on('keyup', function () {
            var index = table.column('Card Number:name').index();
            table.column(index).search($.trim(this.value)).draw();
        });

        $('#billingZipFilter').on('keyup', function () {
            var index = table.column('Billing Zip:name').index();
            table.column(index).search($.trim(this.value)).draw();
        });

        $('#transactionDateFilter').on('change', function () {
            var index = table.column('Transaction Date:name').index();
            table.column(index).search($.trim(this.value)).draw();
        });

        $('#authTokenFilter').on('keyup', function () {
            var index = table.column('Authorization Token:name').index();
            table.column(index).search($.trim(this.value)).draw();
        });

        $('#authAmountFilter').on('keyup', function () {
            var index = table.column('Authorization Amount:name').index();
            table.column(index).search($.trim(this.value)).draw();
        });

        $('#warehouseStatusFilter').on('change', function () {
            var index = table.column('Warehouse Status:name').index();
            table.column(index).search($.trim(this.value)).draw();
        });
    }
// Populate the column chooser modal
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

    // Make the selected columns sortable
    $('#selectedColumns').sortable({
        placeholder: 'ui-state-highlight',
        axis: 'y',
        update: function(event, ui) {
            const newOrder = $(this).sortable('toArray', { attribute: 'data-column' });
            table.colReorder.order(newOrder);
        }
    }).disableSelection();
}

// Function to apply the chosen columns when the "Apply" button is clicked
document.getElementById('applyColumns').addEventListener('click', function () {
    const selectedColumns = document.querySelectorAll('#selectedColumns li');
    const newOrder = Array.from(selectedColumns).map(item => parseInt(item.getAttribute('data-column')));

    // Apply the new order and visibility
    table.colReorder.order(newOrder);

    selectedColumns.forEach(item => {
        const columnIdx = parseInt(item.getAttribute('data-column'));
        table.column(columnIdx).visible(true);
    });

    // Hide columns in the available list
    document.querySelectorAll('#availableColumns li').forEach(item => {
        const columnIdx = parseInt(item.getAttribute('data-column'));
        table.column(columnIdx).visible(false);
    });

    // Hide the modal
    $('#chooseColumnsModal').modal('hide');
});


    // Update totals function
    function updateTotals() {
        let totalAmount = 0;
        let totalTransactionAmount = 0;

        $('#orderTable tbody tr').each(function() {
            const amount = parseFloat($(this).find('td').eq(6).text().replace('$', '')) || 0;
            const transactionAmount = parseFloat($(this).find('td').eq(12).text().replace('$', '')) || 0;

            totalAmount += amount;
            totalTransactionAmount += transactionAmount;
        });

        $('#totalAmount').text(`$${totalAmount.toFixed(2)}`);
        $('#totalTransactionAmount').text(`$${totalTransactionAmount.toFixed(2)}`);
    }

    updateTotals();  // Call this function after initial load

    // Event listener for the Download button
    document.getElementById('downloadButton').addEventListener('click', function () {
        $('#downloadModal').modal('show');
    });

    // Event listener for confirming the download format
    document.getElementById('downloadConfirm').addEventListener('click', function () {
        const format = document.getElementById('downloadFormat').value;
        exportTable(format);
        $('#downloadModal').modal('hide');
    });
});
