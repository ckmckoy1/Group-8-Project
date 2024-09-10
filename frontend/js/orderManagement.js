document.addEventListener('DOMContentLoaded', function () {
    const orderTableBody = document.getElementById('orderTableBody');
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');

    // Fetch the orders from the backend when the page loads
    fetchOrders();

    // Event listener for filtering the orders by Order ID, Customer name, or status
    searchInput.addEventListener('input', filterOrders);
    statusFilter.addEventListener('change', filterOrders);

    // Function to fetch orders from the backend API and display them in the table
    async function fetchOrders() {
        try {
            const response = await fetch('/api/orders');  // This API should fetch the orders from MongoDB
            const orders = await response.json();

            displayOrders(orders);
        } catch (error) {
            console.error('Error fetching orders:', error);
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = 'Error fetching orders. Please try again later.';
            messageDiv.style.display = 'block';
        }
    }

    // Function to display orders in the table
    function displayOrders(orders) {
        orderTableBody.innerHTML = ''; // Clear the table before adding new rows

        orders.forEach(order => {
            const row = document.createElement('tr');

            const orderIdCell = document.createElement('td');
            orderIdCell.textContent = order.orderId;

            const customerCell = document.createElement('td');
            customerCell.textContent = `${order.firstName} ${order.lastName}`;  // Adjusted to match the backend schema

            const statusCell = document.createElement('td');
            statusCell.textContent = order.status;  // Adjust this field based on your schema (e.g., 'paymentStatus')

            const amountCell = document.createElement('td');
            amountCell.textContent = `$${order.authorizedAmount.toFixed(2)}`;  // Display the authorized amount

            row.appendChild(orderIdCell);
            row.appendChild(customerCell);
            row.appendChild(statusCell);
            row.appendChild(amountCell);

            orderTableBody.appendChild(row);
        });
    }

    // Function to filter the orders based on customer name or status
    function filterOrders() {
        const filterValue = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value.toLowerCase();
        const rows = orderTableBody.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const customerCell = row.cells[1].textContent.toLowerCase();
            const statusCell = row.cells[2].textContent.toLowerCase();

            const matchesCustomer = customerCell.includes(filterValue);
            const matchesStatus = !statusValue || statusCell.includes(statusValue);

            if (matchesCustomer && matchesStatus) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    }

    // Example sorting function (can be extended)
    function sortTable(column) {
        const rows = Array.from(orderTableBody.getElementsByTagName('tr'));

        rows.sort((a, b) => {
            const valueA = a.cells[column].textContent;
            const valueB = b.cells[column].textContent;

            if (column === 3) { // If sorting by amount (index 3), parse the numbers
                return parseFloat(valueA.slice(1)) - parseFloat(valueB.slice(1));
            }

            return valueA.localeCompare(valueB); // For other columns, use alphabetical sorting
        });

        // Reorder the rows in the table
        rows.forEach(row => orderTableBody.appendChild(row));
    }
});
