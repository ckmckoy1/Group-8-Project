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
            ordering: true,
            pageLength: 10,
            scrollX: true,
            scrollY: '50vh',
            orderCellsTop: true,
            colReorder: {
                realtime: false // Disable realtime reordering to prevent conflicts
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
            
                // Shipping Information
                { name: 'Shipping Method', targets: 3, orderable: true },
                { name: 'Shipping Address', targets: 4, orderable: true },
                { name: 'Unit Number', targets: 5, orderable: true },
                { name: 'Shipping City', targets: 6, orderable: true },
                { name: 'Shipping State', targets: 7, orderable: true },
                { name: 'Shipping Zip', targets: 8, orderable: true },
            
                // Billing Information
                { name: 'Billing Address', targets: 9, orderable: true },
                { name: 'Billing City', targets: 10, orderable: true },
                { name: 'Billing State', targets: 11, orderable: true },
                { name: 'Billing Zip', targets: 12, orderable: true },
            
                { name: 'Total Amount', targets: 13, orderable: true },
                { name: 'Payment Status', targets: 14, orderable: true },
                { name: 'Card Number', targets: 15, orderable: true },
                { name: 'Card Brand', targets: 16, orderable: true },
                { name: 'Expiration Date', targets: 17, orderable: true },
                { name: 'Transaction Date', targets: 18, orderable: true },
                { name: 'Order Date', targets: 19, orderable: true },
                { name: 'Order Time', targets: 20, orderable: true },
                { name: 'Authorization Token', targets: 21, orderable: true },
                { name: 'Authorization Amount', targets: 22, orderable: true },
                { name: 'Authorization Expiration', targets: 23, orderable: true },
                { name: 'Warehouse Status', targets: 24, orderable: true },
                { name: 'Warehouse Approval Date', targets: 25, orderable: true }
            ]
            
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
    // Hide the error message when orders are successfully displayed
    if (messageDiv) {
        messageDiv.style.display = 'none'; // Ensure error message is hidden
    }

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.OrderID}</td>
            <td>${order.FirstName} ${order.LastName}</td>
            <td>${order.CustomerEmail}</td>

            <!-- Shipping Information -->
            <td>${order.ShippingMethod}</td>
            <td>${order.ShippingAddress}</td>
            <td>${order.UnitNumber}</td>
            <td>${order.ShippingCity}</td>
            <td>${order.ShippingState}</td>
            <td>${order.ShippingZip}</td>
           
            
            <!-- Billing Information -->
            <td>${order.BillingAddress}</td> 
            <td>${order.BillingCity}</td> 
            <td>${order.BillingState}</td> 
            <td>${order.BillingZipCode}</td>

            <td>$${order.TotalAmount.toFixed(2)}</td>
            <td>${order.PaymentStatus}</td>
            <td>**** **** **** ${order.CardNumber.slice(-4)}</td>
            <td>${order.CardBrand}</td>
            <td>${order.ExpirationDate}</td>
            <td>${new Date(order.TransactionDateTime).toLocaleString()}</td>
            <td>${order.OrderDate}</td>
            <td>${order.OrderTime}</td>
            <td>${order.AuthorizationToken}</td>
            <td>$${order.AuthorizationAmount.toFixed(2)}</td>
            <td>${new Date(order.AuthorizationExpirationDate).toLocaleString()}</td>
            <td>${order.WarehouseStatus || 'N/A'}</td>
            <td>${order.WarehouseApprovalDate || 'N/A'}</td>
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
        table.column('Order ID:name').search(this.value).draw();
    });
    $('#customerFilter').on('keyup', function () {
        table.column('Customer:name').search(this.value).draw();
    });
    $('#emailFilter').on('keyup', function () {
        table.column('Email:name').search(this.value).draw();
    });
    $('#shippingAddressFilter').on('keyup', function () {
        table.column('Shipping Address:name').search(this.value).draw();
    });
    $('#shippingCityFilter').on('keyup', function () {
        table.column('Shipping City:name').search(this.value).draw();
    });
    $('#shippingStateFilter').on('keyup', function () {
        table.column('Shipping State:name').search(this.value).draw();
    });
    $('#shippingZipFilter').on('keyup', function () {
        table.column('Shipping Zip:name').search(this.value).draw();
    });
    $('#billingAddressFilter').on('keyup', function () {
        table.column('Billing Address:name').search(this.value).draw();
    });
    $('#billingCityFilter').on('keyup', function () {
        table.column('Billing City:name').search(this.value).draw();
    });
    $('#billingStateFilter').on('keyup', function () {
        table.column('Billing State:name').search(this.value).draw();
    });
    $('#billingZipFilter').on('keyup', function () {
        table.column('Billing Zip:name').search(this.value).draw();
    });
    $('#amountFilter').on('keyup', function () {
        table.column('Total Amount:name').search(this.value).draw();
    });
    $('#cardNumberFilter').on('keyup', function () {
        table.column('Card Number:name').search(this.value).draw();
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
    $('#warehouseapprovalDateFilter').on('change', function () {
        table.column('Warehouse Approval Date:name').search(this.value).draw();
    });
}

// Update totals function
function updateTotals() {
    let totalAmount = 0;
    let totalTransactionAmount = 0;

    $('#orderTable tbody tr').each(function () {
        const amount = parseFloat($(this).find('td').eq(9).text().replace('$', '')) || 0;  // Updated index for Total Amount
        const transactionAmount = parseFloat($(this).find('td').eq(19).text().replace('$', '')) || 0; // Updated index for Authorization Amount

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

// Update table column visibility and order
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
})
