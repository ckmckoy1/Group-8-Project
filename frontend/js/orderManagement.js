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
            scrollX: true, // Enable horizontal scrolling
            scrollY: '50vh', // Example to make the table vertically scrollable with fixed height
            orderCellsTop: true,
            dom: '<"row mb-3 align-items-center"<"col-md-6 d-flex align-items-center"lB><"col-md-6 d-flex justify-content-end"f>>' +
                'rt' +
                '<"row"<"col-md-6"i><"col-md-6"p>>',
            buttons: [
                { extend: 'csv', className: 'buttons-csv', text: 'CSV' },
                { extend: 'pdf', className: 'buttons-pdf', text: 'PDF' },
                { extend: 'excel', className: 'buttons-excel', text: 'Excel' }
            ],
            colReorder: true, // Add this option to enable column reordering
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
    }

    // Add filtering functionality for individual columns
    function addColumnFiltering() {
        $('#orderIDFilter').on('keyup', function () {
            table.column(0).search(this.value).draw();
        });
        $('#customerFilter').on('keyup', function () {
            table.column(1).search(this.value).draw();
        });
        $('#emailFilter').on('keyup', function () {
            table.column(2).search(this.value).draw();
        });
        $('#addressFilter').on('keyup', function () {
            table.column(3).search(this.value).draw();
        });
        $('#shippingMethodFilter').on('change', function () {
            table.column(4).search(this.value).draw();
        });
        $('#statusFilter').on('change', function () {
            table.column(5).search(this.value).draw();
        });
        $('#amountFilter').on('keyup', function () {
            table.column(6).search(this.value).draw();
        });
        $('#cardNumberFilter').on('keyup', function () {
            table.column(7).search(this.value).draw();
        });
        $('#billingZipFilter').on('keyup', function () {
            table.column(9).search(this.value).draw();
        });
        $('#transactionDateFilter').on('change', function () {
            table.column(10).search(this.value).draw();
        });
        $('#authTokenFilter').on('keyup', function () {
            table.column(11).search(this.value).draw();
        });
        $('#authAmountFilter').on('keyup', function () {
            table.column(12).search(this.value).draw();
        });
        $('#warehouseStatusFilter').on('change', function () {
            table.column(14).search(this.value).draw();
        });
    }

    // Download modal: show the modal and handle the export
    document.getElementById('downloadButton').addEventListener('click', function () {
        $('#downloadModal').modal('show');
    });

    document.getElementById('downloadConfirm').addEventListener('click', function () {
        const format = document.getElementById('downloadFormat').value;
        exportTable(format);
        $('#downloadModal').modal('hide');
    });

    // Function to trigger the export of the table in the selected format
    function exportTable(format) {
        if (format === 'csv') {
            table.button('.buttons-csv').trigger();
        } else if (format === 'pdf') {
            table.button('.buttons-pdf').trigger();
        } else if (format === 'excel') {
            table.button('.buttons-excel').trigger();
        }
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
            // Sync column widths after reordering
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

}); // <- This is where your missing closing brace should be
