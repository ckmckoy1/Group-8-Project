document.addEventListener('DOMContentLoaded', function () {
    const orderTableBody = document.getElementById('orderTableBody');
    let orders = [];
    let table;

    // Fetch the orders from the backend when the page loads
    fetchOrders();

    // Event listener for the Refresh button
    document.getElementById('refreshTable').addEventListener('click', function () {
        fetchOrders(true);
    });

    // Event listener for Choose Columns button
    document.getElementById('chooseColumns').addEventListener('click', function () {
        populateColumnChooser();
        $('#chooseColumnsModal').modal('show');
    });

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
        searching: false,
        info: true,
        ordering: false,
        pageLength: 10,
        // Customize the layout using the `dom` option
        dom: '<"row mb-3 align-items-center"<"col-md-6 d-flex align-items-center"Bl><"col-md-6 d-flex justify-content-end"f>>' +
             'rt' + 
             '<"row"<"col-md-6"i><"col-md-6"p>>',
        
        language: {
            lengthMenu: 'Show _MENU_ entries' // Text for dropdown
        }
    });
}


    // Export the table to selected format
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
            const columnTitle = this.header().textContent;
            const listItem = `<li class="list-group-item" data-column="${index}">${columnTitle}</li>`;

            if (this.visible()) {
                selectedColumns.innerHTML += listItem;
            } else {
                availableColumns.innerHTML += listItem;
            }
        });
    }

    // Apply chosen columns
    document.getElementById('applyColumns').addEventListener('click', function () {
        const availableColumns = document.querySelectorAll('#availableColumns li');
        const selectedColumns = document.querySelectorAll('#selectedColumns li');

        availableColumns.forEach(item => {
            const columnIdx = parseInt(item.getAttribute('data-column'));
            table.column(columnIdx).visible(false);
        });

        selectedColumns.forEach(item => {
            const columnIdx = parseInt(item.getAttribute('data-column'));
            table.column(columnIdx).visible(true);
        });

        $('#chooseColumnsModal').modal('hide');
    });
});
