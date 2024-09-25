document.addEventListener('DOMContentLoaded', function () {
    const orderTableBody = document.getElementById('orderTableBody');
    let orders = [];
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
            orders = await response.json();

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

    // Initialize DataTables
    function initializeDataTable() {
        table = $('#orderTable').DataTable({
            paging: true,
            lengthMenu: [10, 25, 50, 100], // Number of records shown in dropdown
            searching: true, // Enable global searching
            info: true,
            ordering: true,
            pageLength: 10,
            orderCellsTop: true, // Apply sorting to the first header row
            dom: '<"row mb-3 align-items-center"<"col-md-6 d-flex align-items-center"B><"col-md-6 d-flex justify-content-end"l>>' +
                 'rt' + 
                 '<"row"<"col-md-6"i><"col-md-6"p>>', // info and pagination at the bottom
            language: {
                lengthMenu: 'Show _MENU_ entries',
                info: 'Showing _START_ to _END_ of _TOTAL_ entries',
                paginate: {
                    previous: 'Previous',
                    next: 'Next'
                }
            }
        });

        // Add filtering functionality for individual columns after the table is initialized
        addColumnFiltering();
    }

    // Add filtering functionality for individual columns
    function addColumnFiltering() {
        $('#orderIDFilter').on('keyup', function () {
            table.column(0).search(this.value).draw(); // Search in the first column (Order ID)
        });

        $('#customerFilter').on('keyup', function () {
            table.column(1).search(this.value).draw(); // Search in the second column (Customer)
        });

        $('#emailFilter').on('keyup', function () {
            table.column(2).search(this.value).draw(); // Search in the third column (Email)
        });

        $('#addressFilter').on('keyup', function () {
            table.column(3).search(this.value).draw(); // Search in the fourth column (Address)
        });

        $('#shippingMethodFilter').on('change', function () {
            table.column(4).search(this.value).draw(); // Search in the fifth column (Shipping Method)
        });

        $('#statusFilter').on('change', function () {
            table.column(5).search(this.value).draw(); // Search in the sixth column (Status)
        });

        $('#amountFilter').on('keyup', function () {
            table.column(6).search(this.value).draw(); // Search in the seventh column (Amount)
        });

        $('#cardNumberFilter').on('keyup', function () {
            table.column(7).search(this.value).draw(); // Search in the eighth column (Card Number)
        });

        $('#billingZipFilter').on('keyup', function () {
            table.column(9).search(this.value).draw(); // Search in the tenth column (Billing Zip)
        });

        $('#transactionDateFilter').on('change', function () {
            table.column(10).search(this.value).draw(); // Search in the eleventh column (Transaction Date)
        });

        $('#authTokenFilter').on('keyup', function () {
            table.column(11).search(this.value).draw(); // Search in the twelfth column (Authorization Token)
        });

        $('#authAmountFilter').on('keyup', function () {
            table.column(12).search(this.value).draw(); // Search in the thirteenth column (Authorization Amount)
        });

        $('#warehouseStatusFilter').on('change', function () {
            table.column(14).search(this.value).draw(); // Search in the fifteenth column (Warehouse Status)
        });
    }
 // Export the table to selected format
    document.getElementById('downloadConfirm').addEventListener('click', function () {
        const format = document.getElementById('downloadFormat').value;
        exportTable(format);
        $('#downloadModal').modal('hide');
    });

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
    document.getElementById('chooseColumns').addEventListener('click', function () {
        populateColumnChooser();
        $('#chooseColumnsModal').modal('show');
    });

    function populateColumnChooser() {
        const availableColumns = document.getElementById('availableColumns');
        const selectedColumns = document.getElementById('selectedColumns');

        availableColumns.innerHTML = '';
        selectedColumns.innerHTML = '';

        // Loop through each column in DataTable and create list items
        table.columns().every(function (index) {
            const columnTitle = this.header().textContent.trim(); // Get the column title
            const listItem = `<li class="list-group-item" data-column="${index}">${columnTitle}</li>`;

            // Append to the respective list based on column visibility
            if (this.visible()) {
                selectedColumns.innerHTML += listItem;
            } else {
                availableColumns.innerHTML += listItem;
            }
        });

        setupColumnListEvents(); // Setup events for column list item clicks
    }

    // Setup events for column list items
    function setupColumnListEvents() {
        // Move columns from Available to Selected
        $('#availableColumns').on('click', 'li', function () {
            const columnItem = $(this).detach(); // Remove from available list
            $('#selectedColumns').append(columnItem); // Append to selected list
        });

        // Move columns from Selected to Available
        $('#selectedColumns').on('click', 'li', function () {
            const columnItem = $(this).detach(); // Remove from selected list
            $('#availableColumns').append(columnItem); // Append to available list
        });
    }

    // Apply chosen columns when "Apply" button is clicked
    document.getElementById('applyColumns').addEventListener('click', function () {
        const availableColumns = document.querySelectorAll('#availableColumns li');
        const selectedColumns = document.querySelectorAll('#selectedColumns li');

        // Hide columns in "Available" list
        availableColumns.forEach(item => {
            const columnIdx = parseInt(item.getAttribute('data-column'));
            table.column(columnIdx).visible(false);
        });

        // Show columns in "Selected" list
        selectedColumns.forEach(item => {
            const columnIdx = parseInt(item.getAttribute('data-column'));
            table.column(columnIdx).visible(true);
        });

        // Hide the modal after applying changes
        $('#chooseColumnsModal').modal('hide');
    });
});

 // Export the table to selected format
 document.getElementById('downloadConfirm').addEventListener('click', function () {
    const format = document.getElementById('downloadFormat').value;
    exportTable(format);
    $('#downloadModal').modal('hide');
});

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
document.getElementById('chooseColumns').addEventListener('click', function () {
    populateColumnChooser();
    $('#chooseColumnsModal').modal('show');
});

function populateColumnChooser() {
    const availableColumns = document.getElementById('availableColumns');
    const selectedColumns = document.getElementById('selectedColumns');

    availableColumns.innerHTML = '';
    selectedColumns.innerHTML = '';

    // Loop through each column in DataTable and create list items
    table.columns().every(function (index) {
        const columnTitle = this.header().textContent.trim(); // Get the column title
        const listItem = `<li class="list-group-item" data-column="${index}">${columnTitle}</li>`;

        // Append to the respective list based on column visibility
        if (this.visible()) {
            selectedColumns.innerHTML += listItem;
        } else {
            availableColumns.innerHTML += listItem;
        }
    });

    setupColumnListEvents(); // Setup events for column list item clicks
}

// Setup events for column list items
function setupColumnListEvents() {
    // Move columns from Available to Selected
    $('#availableColumns').on('click', 'li', function () {
        const columnItem = $(this).detach(); // Remove from available list
        $('#selectedColumns').append(columnItem); // Append to selected list
    });

    // Move columns from Selected to Available
    $('#selectedColumns').on('click', 'li', function () {
        const columnItem = $(this).detach(); // Remove from selected list
        $('#availableColumns').append(columnItem); // Append to available list
    });
}

// Apply chosen columns when "Apply" button is clicked
document.getElementById('applyColumns').addEventListener('click', function () {
    const availableColumns = document.querySelectorAll('#availableColumns li');
    const selectedColumns = document.querySelectorAll('#selectedColumns li');

    // Hide columns in "Available" list
    availableColumns.forEach(item => {
        const columnIdx = parseInt(item.getAttribute('data-column'));
        table.column(columnIdx).visible(false);
    });

    // Show columns in "Selected" list
    selectedColumns.forEach(item => {
        const columnIdx = parseInt(item.getAttribute('data-column'));
        table.column(columnIdx).visible(true);
    });

    // Hide the modal after applying changes
    $('#chooseColumnsModal').modal('hide');
});

