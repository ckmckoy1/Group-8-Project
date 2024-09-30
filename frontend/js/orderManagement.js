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
                // The following columns will be hidden by default
                { name: 'Shipping Method', targets: 3, orderable: true, visible: false },
                { name: 'Shipping Address', targets: 4, orderable: true, visible: false },
                { name: 'Unit Number', targets: 5, orderable: true, visible: false },
                { name: 'Shipping City', targets: 6, orderable: true, visible: false },
                { name: 'Shipping State', targets: 7, orderable: true, visible: false },
                { name: 'Shipping Zip', targets: 8, orderable: true, visible: false },
                { name: 'Billing Address', targets: 9, orderable: true, visible: false },
                { name: 'Billing City', targets: 10, orderable: true, visible: false },
                { name: 'Billing State', targets: 11, orderable: true, visible: false },
                { name: 'Order Date', targets: 19, orderable: true, visible: false },
                { name: 'Order Time', targets: 20, orderable: true, visible: false },
                { name: 'Total Amount', targets: 13, orderable: true },
                { name: 'Payment Status', targets: 14, orderable: true },
                { name: 'Card Number', targets: 15, orderable: true },
                { name: 'Card Brand', targets: 16, orderable: true },
                { name: 'Expiration Date', targets: 17, orderable: true },
                { name: 'Transaction Date', targets: 18, orderable: true },
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

      // Add column filtering and other functionalities...
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
        <td>${order.OrderID}</td>            <!-- index 0 -->
        <td>${order.FirstName} ${order.LastName}</td> <!-- index 1 -->
        <td>${order.CustomerEmail}</td>       <!-- index 2 -->
        <td>${order.ShippingMethod}</td>      <!-- index 3 -->
        <td>${order.ShippingAddress}</td>     <!-- index 4 -->
        <td>${order.UnitNumber}</td>          <!-- index 5 -->
        <td>${order.ShippingCity}</td>        <!-- index 6 -->
        <td>${order.ShippingState}</td>       <!-- index 7 -->
        <td>${order.ShippingZip}</td>         <!-- index 8 -->
        <td>${order.BillingAddress}</td>      <!-- index 9 -->
        <td>${order.BillingCity}</td>         <!-- index 10 -->
        <td>${order.BillingState}</td>        <!-- index 11 -->
        <td>${order.BillingZipCode}</td>      <!-- index 12 -->
        <td>$${order.TotalAmount.toFixed(2)}</td> <!-- index 13 -->
        <td>${order.PaymentStatus}</td>       <!-- index 14 -->
        <td>**** **** **** ${order.CardNumber.slice(-4)}</td> <!-- index 15 -->
        <td>${order.CardBrand}</td>           <!-- index 16 -->
        <td>${order.ExpirationDate}</td>      <!-- index 17 -->
        <td>${new Date(order.TransactionDateTime).toLocaleString()}</td> <!-- index 18 -->
        <td>${order.OrderDate}</td>           <!-- index 19 -->
        <td>${order.OrderTime}</td>           <!-- index 20 -->
        <td>${order.AuthorizationToken}</td>  <!-- index 21 -->
        <td>$${order.AuthorizationAmount.toFixed(2)}</td> <!-- index 22 -->
        <td>${new Date(order.AuthorizationExpirationDate).toLocaleString()}</td> <!-- index 23 -->
        <td>${order.WarehouseStatus || 'N/A'}</td> <!-- index 24 -->
        <td>${order.WarehouseApprovalDate || 'N/A'}</td> <!-- index 25 -->
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

// Populate the column chooser
function populateColumnChooser() {
    const availableColumns = document.getElementById('availableColumns');
    const selectedColumns = document.getElementById('selectedColumns');

    availableColumns.innerHTML = '';
    selectedColumns.innerHTML = '';

    // Populate columns into the chooser
    table.columns().every(function (index) {
        const columnTitle = this.header().textContent.trim();
        const columnVisible = this.visible();
        const listItem = `<li class="item" data-column="${index}"><span class="ui-icon ui-icon-arrowthick-2-n-s"></span>${columnTitle}</li>`;

        if (columnVisible) {
            selectedColumns.innerHTML += listItem;  // Add to selected columns
        } else {
            availableColumns.innerHTML += listItem;  // Add to available columns
        }
    });

    // Make columns draggable and sortable within selected columns
    $('#selectedColumns').sortable({
        placeholder: 'ui-state-highlight',
        axis: 'y',
        update: function (event, ui) {
            updateColumnOrder();
        }
    }).disableSelection();

    // Allow dragging between available and selected columns
    $('#availableColumns, #selectedColumns').sortable({
        connectWith: '.list',
        update: function () {
            updateColumnVisibility();
        }
    }).disableSelection();
}

// Function to update column visibility based on user's actions
function updateColumnVisibility() {
    const selectedItems = document.querySelectorAll('#selectedColumns li');
    const availableItems = document.querySelectorAll('#availableColumns li');

    // Show selected columns
    selectedItems.forEach(item => {
        const columnIdx = parseInt(item.getAttribute('data-column'));
        table.column(columnIdx).visible(true);
    });

    // Hide available columns
    availableItems.forEach(item => {
        const columnIdx = parseInt(item.getAttribute('data-column'));
        table.column(columnIdx).visible(false);
    });
}

// Function to update column order based on the current order in selected list
function updateColumnOrder() {
    const selectedItems = document.querySelectorAll('#selectedColumns li');
    const newOrder = Array.from(selectedItems).map(item => parseInt(item.getAttribute('data-column')));

    // Apply the new column order to DataTables
    table.colReorder.order(newOrder);
}

// Event listener to show the column chooser modal
document.getElementById('chooseColumnsButton').addEventListener('click', function () {
    $('#choose-columns-dialog').show();
    populateColumnChooser();  // Populate column chooser when modal opens
});

// Apply the selected columns when user clicks "Save"
document.getElementById('applyColumns').addEventListener('click', function () {
    updateColumnVisibility();  // Update the visibility of columns
    updateColumnOrder();  // Update the order of columns
    $('#choose-columns-dialog').hide();  // Hide the modal
});

// Cancel and hide the modal when user clicks "Cancel"
document.getElementById('cancelColumns').addEventListener('click', function () {
    $('#choose-columns-dialog').hide();
});
});
