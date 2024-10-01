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
            ordering: true, // Enable ordering
            order: [], // Initial no ordering
            pageLength: 10,
            scrollX: true,
            scrollY: '50vh',
            orderCellsTop: true,
            colReorder: {
                realtime: true, // Enable realtime reordering (drag-and-drop)
                // Optionally, specify any ColReorder options here
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
                {
                    extend: 'csv',
                    className: 'd-none' // Hide the button
                },
                {
                    extend: 'excel',
                    className: 'd-none' // Hide the button
                },
                {
                    extend: 'pdfHtml5',
                    className: 'd-none', // Hide the button
                    orientation: 'landscape', // Landscape mode
                    pageSize: 'A4', // Use A4 paper size
                    customize: function (doc) {
                        // Adjust layout to fit content within page
                        doc.content[1].table.widths = '*'.repeat(doc.content[1].table.body[0].length).split(''); // Auto-width for each column
                        doc.styles.tableHeader.fontSize = 10; // Smaller font size for header
                        doc.defaultStyle.fontSize = 8; // Smaller font size for table content
                    }
                }
            ]
        });

  
// Hook into the draw event to ensure totals are updated after the table is drawn
table.on('draw', updateTotals);
      
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
        table.column(0).search(this.value).draw(); // Order ID (column index 0)
    });
    $('#customerFilter').on('keyup', function () {
        table.column(1).search(this.value).draw(); // Customer (column index 1)
    });
    $('#emailFilter').on('keyup', function () {
        table.column(2).search(this.value).draw(); // Email (column index 2)
    });
    $('#shippingAddressFilter').on('keyup', function () {
        table.column(4).search(this.value).draw(); // Shipping Address (column index 4)
    });
    $('#unitNumberFilter').on('keyup', function () {
        table.column(5).search(this.value).draw(); // Unit Number (column index 5)
    });
    $('#shippingCityFilter').on('keyup', function () {
        table.column(6).search(this.value).draw(); // Shipping City (column index 6)
    });
    $('#shippingStateFilter').on('keyup', function () {
        table.column(7).search(this.value).draw(); // Shipping State (column index 7)
    });
    $('#shippingZipFilter').on('keyup', function () {
        table.column(8).search(this.value).draw(); // Shipping Zip (column index 8)
    });
    $('#billingAddressFilter').on('keyup', function () {
        table.column(9).search(this.value).draw(); // Billing Address (column index 9)
    });
    $('#billingCityFilter').on('keyup', function () {
        table.column(10).search(this.value).draw(); // Billing City (column index 10)
    });
    $('#billingStateFilter').on('keyup', function () {
        table.column(11).search(this.value).draw(); // Billing State (column index 11)
    });
    $('#billingZipFilter').on('keyup', function () {
        table.column(12).search(this.value).draw(); // Billing Zip (column index 12)
    });
    $('#amountFilter').on('keyup', function () {
        table.column(13).search(this.value).draw(); // Total Amount (column index 13)
    });
    $('#cardNumberFilter').on('keyup', function () {
        table.column(15).search(this.value).draw(); // Card Number (column index 15)
    });
    $('#transactionDateFilter').on('change', function () {
        table.column(18).search(this.value).draw(); // Transaction Date (column index 18)
    });
    $('#authTokenFilter').on('keyup', function () {
        table.column(21).search(this.value).draw(); // Authorization Token (column index 21)
    });
    $('#authAmountFilter').on('keyup', function () {
        table.column(22).search(this.value).draw(); // Authorization Amount (column index 22)
    });
    $('#warehouseApprovalDateFilter').on('change', function () {
        table.column(25).search(this.value).draw(); // Warehouse Approval Date (column index 25)
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
function initializeDropdownFilter(buttonId, optionsId, columnIndex) {
    const filterButton = document.getElementById(buttonId);
    const filterOptions = document.getElementById(optionsId);
    const checkboxes = filterOptions.querySelectorAll('input[type="checkbox"]');

    // Toggle dropdown on button click
    filterButton.addEventListener('click', function (e) {
        e.stopPropagation();
        filterOptions.style.display = filterOptions.style.display === 'none' ? 'block' : 'none';
    });

    // Hide dropdown when clicking outside
    document.addEventListener('click', function () {
        filterOptions.style.display = 'none';
    });

    // Handle selection and filtering logic
    filterOptions.addEventListener('click', function (e) {
        if (e.target.tagName === 'INPUT') {
            const selectedOption = e.target.parentNode.getAttribute('data-value');

            if (selectedOption === 'selectAll') {
                // Select all options except "Clear All"
                checkboxes.forEach(checkbox => {
                    if (checkbox.parentNode.getAttribute('data-value') !== 'clearAll') {
                        checkbox.checked = true;
                    }
                });
            } else if (selectedOption === 'clearAll') {
                // Clear all options, including "Select All"
                checkboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
                filterButton.textContent = 'Choose...'; // Reset button text
            } else {
                // Deselect "Clear All" and "Select All" if any individual option is checked
                document.querySelector(`[data-value="clearAll"] input`).checked = false;
                document.querySelector(`[data-value="selectAll"] input`).checked = false;
            }

            // Update the table with selected filters
            updateTableFilter(columnIndex, checkboxes);
        }
    });
}

// Update the table based on selected filters
function updateTableFilter(columnIndex, checkboxes) {
    const selectedValues = [];

    checkboxes.forEach(checkbox => {
        if (checkbox.checked && checkbox.parentNode.getAttribute('data-value') !== 'selectAll' && checkbox.parentNode.getAttribute('data-value') !== 'clearAll') {
            selectedValues.push(checkbox.parentNode.getAttribute('data-value'));
        }
    });

    // If no filters are selected, reset the filter
    if (selectedValues.length === 0) {
        table.column(columnIndex).search('').draw();
    } else {
        // Use a regex to match any of the selected values
        const regex = selectedValues.join('|');
        table.column(columnIndex).search(regex, true, false).draw();
    }
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
        table.button('.buttons-csv').trigger();  // Trigger hidden CSV button
    } else if (format === 'pdf') {
        table.button('.buttons-pdfHtml5').trigger();  // Trigger hidden PDF button
    } else if (format === 'excel') {
        table.button('.buttons-excel').trigger(); // Trigger hidden Excel button
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
    }).disableSelection();
}

// Update table column visibility and order
function updateTableColumns() {
    const selectedColumns = document.querySelectorAll('#selectedColumns li');

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

    // Ensure proper alignment by adjusting the columns, headers, and footers
    table.columns.adjust().draw(false); // Adjust without full redraw for performance
}

// Apply column selections and close modal
document.getElementById('applyColumns').addEventListener('click', function () {
    updateTableColumns(); // Update the table based on modal selections
    $('#chooseColumnsModal').modal('hide'); // Close the modal after applying changes
    ensureAlignment(); // Ensure alignment after columns are applied
});

// Initialize the modal with columns when the "Choose Columns" button is clicked
document.getElementById('chooseColumns').addEventListener('click', function () {
    populateColumnChooser(); // Populate the modal with available and selected columns
});

// Ensure table headers, footers, and inputs are aligned after column changes
function ensureAlignment() {
    // Ensure the table aligns columns, header, footer, and input sizes
    table.columns.adjust().draw(false); // Adjust and redraw to fix any alignment issues
}
});
