document.addEventListener('DOMContentLoaded', function () {
    const ordersTable = document.getElementById('ordersTable');
    const filterInput = document.getElementById('filterInput');
    const sortSelect = document.getElementById('sortSelect');

    // Fetch the orders from the server when the page loads
    fetchOrders();

    // Event listener for filtering the orders by customer name or status
    filterInput.addEventListener('input', filterOrders);

    // Event listener for sorting the orders by different criteria
    sortSelect.addEventListener('change', sortOrders);

    // Function to fetch orders from the server and display them in the table
    async function fetchOrders() {
        try {
            const response = await fetch('/orders');
            const orders = await response.json();

            displayOrders(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    // Function to display orders in the table
    function displayOrders(orders) {
        ordersTable.innerHTML = ''; // Clear the table before adding new rows

        orders.forEach(order => {
            const row = document.createElement('tr');

            const orderIdCell = document.createElement('td');
            orderIdCell.textContent = order.orderId;

            const customerCell = document.createElement('td');
            customerCell.textContent = `${order.customer.firstName} ${order.customer.lastName}`;

            const statusCell = document.createElement('td');
            statusCell.textContent = order.paymentStatus;

            const amountCell = document.createElement('td');
            amountCell.textContent = `$${order.amount}`;

            row.appendChild(orderIdCell);
            row.appendChild(customerCell);
            row.appendChild(statusCell);
            row.appendChild(amountCell);

            ordersTable.appendChild(row);
        });
    }

    // Function to filter the orders based on customer name or status
    function filterOrders() {
        const filterValue = filterInput.value.toLowerCase();
        const rows = ordersTable.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const customerCell = row.cells[1].textContent.toLowerCase();
            const statusCell = row.cells[2].textContent.toLowerCase();

            if (customerCell.includes(filterValue) || statusCell.includes(filterValue)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    }

    // Function to sort orders based on the selected criteria
    function sortOrders() {
        const sortValue = sortSelect.value;
        const rows = Array.from(ordersTable.getElementsByTagName('tr'));

        rows.sort((a, b) => {
            const valueA = getCellValue(a, sortValue);
            const valueB = getCellValue(b, sortValue);

            if (sortValue === 'amount') {
                return parseFloat(valueA.slice(1)) - parseFloat(valueB.slice(1));
            } else {
                return valueA.localeCompare(valueB);
            }
        });

        rows.forEach(row => ordersTable.appendChild(row)); // Reorder the rows in the table
    }

    // Function to get the value of a specific cell based on the sorting criteria
    function getCellValue(row, sortValue) {
        switch (sortValue) {
            case 'orderId':
                return row.cells[0].textContent;
            case 'customer':
                return row.cells[1].textContent;
            case 'status':
                return row.cells[2].textContent;
            case 'amount':
                return row.cells[3].textContent;
            default:
                return '';
        }
    }
});
