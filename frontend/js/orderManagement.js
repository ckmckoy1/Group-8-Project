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
            responsive: true,
            paging: true,
            lengthMenu: [10, 25, 50, 100],
            searching: true,
            info: true,
            ordering: true, // Enable ordering
            order: [], // Initial no ordering
            pageLength: 10,
            scrollX: true,
            scrollCollapse: true,
            orderCellsTop: true,
            colReorder: {
                realtime: true, // Enable realtime reordering (drag-and-drop)
                // Optionally, specify any ColReorder options here
            },
            dom: '<"row mb-3 align-items-center"<"col-md-6 d-flex align-items-center"B><"col-md-6 d-flex justify-content-end"l>>' +
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
                { name: 'Shipping Address', targets: 4, orderable: true},
                { name: 'Unit Number', targets: 5, orderable: true },
                { name: 'Shipping City', targets: 6, orderable: true },
                { name: 'Shipping State', targets: 7, orderable: true },
                { name: 'Shipping Zip', targets: 8, orderable: true },
                { name: 'Billing Address', targets: 9, orderable: true },
                { name: 'Billing City', targets: 10, orderable: true },
                { name: 'Billing State', targets: 11, orderable: true },
                { name: 'Order Date', targets: 19, orderable: true},
                { name: 'Order Time', targets: 20, orderable: true },
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
            ],
            buttons: [
                'csv', 'excel', 'pdf' // Standard buttons

            ],
            footerCallback: function ( row, data, start, end, display ) {
                var api = this.api();
    
                // Helper function to parse float
                var parseValue = function (value) {
                    return parseFloat(value.replace(/[^0-9.-]+/g,"")) || 0;
                };
    
                // Calculate total for 'Total Amount' column (index 13)
                var totalAmount = api
                    .column(13)
                    .data()
                    .reduce(function (a, b) {
                        return parseValue(a) + parseValue(b);
                    }, 0);
    
                // Calculate total for 'Authorization Amount' column (index 22)
                var totalAuthAmount = api
                    .column(22)
                    .data()
                    .reduce(function (a, b) {
                        return parseValue(a) + parseValue(b);
                    }, 0);
    
                // Update the footer cells
                $(api.column(13).footer()).html('$' + totalAmount.toFixed(2));
                $(api.column(22).footer()).html('$' + totalAuthAmount.toFixed(2));
            }
        });

  // Listen for column reorder events
  table.on('column-reorder', function (e, settings, details) {
    console.log('Columns reordered');
    // Optionally, you can sync the modal's lists here if needed
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
$('#warehouseApprovalDateFilter').on('change', function () { // Fixed ID: 'warehouseApprovalDateFilter'
    table.column('Warehouse Approval Date:name').search(this.value).draw();
});
}

// Update totals function
function updateTotals() {
let totalAmount = 0;
let totalTransactionAmount = 0;

$('#orderTable tbody tr').each(function () {
    const amount = parseFloat($(this).find('td').eq(13).text().replace('$', '')) || 0;  // Updated index for Total Amount
    const transactionAmount = parseFloat($(this).find('td').eq(22).text().replace('$', '')) || 0; // Updated index for Authorization Amount

    totalAmount += amount;
    totalTransactionAmount += transactionAmount;
});

$('#totalAmount').text(`$${totalAmount.toFixed(2)}`);
$('#totalTransactionAmount').text(`$${totalTransactionAmount.toFixed(2)}`);
}
function initializeDropdownFilter(buttonId, optionsId, columnIndex) {
    // Toggle dropdown on button click
    $(`#${buttonId}`).on('click', function (e) {
        e.stopPropagation();
        $(`#${optionsId}`).toggle();
    });

    // Handle clicks on filter options
    $(`#${optionsId} li`).on('click', function () {
        const value = $(this).data('value');

        if (value === 'selectAll') {
            $(`#${optionsId} input[type="checkbox"]`).prop('checked', true);
        } else if (value === 'clearAll') {
            $(`#${optionsId} input[type="checkbox"]`).prop('checked', false);
        } else {
            // Toggle individual checkbox
            const checkbox = $(this).find('input[type="checkbox"]');
            checkbox.prop('checked', !checkbox.prop('checked'));
        }

        // Close the dropdown after selection
        $(`#${optionsId}`).hide();

        // Collect selected values
        let selectedValues = [];
        $(`#${optionsId} input[type="checkbox"]:checked`).each(function () {
            selectedValues.push($(this).parent().text().trim());
        });

        // Apply the filter
        if (selectedValues.length > 0 && !selectedValues.includes('Select All')) {
            const regex = selectedValues.join('|');
            table.column(columnIndex).search(regex, true, false).draw();
        } else {
            table.column(columnIndex).search('').draw();
        }
    });

    // Hide dropdown when clicking outside
    $(document).on('click', function () {
        $(`#${optionsId}`).hide();
    });
}

// Initialize all dropdown filters
initializeDropdownFilter('shippingMethodFilterButton', 'shippingMethodFilterOptions', 3);
initializeDropdownFilter('paymentstatusFilterButton', 'paymentstatusFilterOptions', 14);
initializeDropdownFilter('warehouseStatusFilterButton', 'warehouseStatusFilterOptions', 24);


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
    // No 'update' callback here to handle updates on Apply button
}).disableSelection();
}

// Update table column visibility and order
function updateTableColumns() {
const selectedColumns = document.querySelectorAll('#selectedColumns li');
const availableColumns = document.querySelectorAll('#availableColumns li');

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

// Adjust columns and redraw the table
table.columns.adjust().draw(false); // The parameter false prevents a full redraw for performance
}

// Apply column selections and close modal
document.getElementById('applyColumns').addEventListener('click', function () {
updateTableColumns(); // Update the table based on modal selections
$('#chooseColumnsModal').modal('hide'); // Close the modal after applying changes
    });
});