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
            const response = await fetch('https://group8-a70f0e413328.herokuapp.com/api/orders'); 
            if (!response.ok) {
                throw new Error('Failed to fetch orders');
            }
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
            orderIdCell.textContent = order.OrderID; // Correct field name

            const customerCell = document.createElement('td');
            customerCell.textContent = `${order.FirstName} ${order.LastName}`; // Correct field names

            const emailCell = document.createElement('td');
            emailCell.textContent = order.CustomerEmail; // Correct field name

            const addressCell = document.createElement('td');
            addressCell.textContent = `${order.StreetAddress}, ${order.UnitNumber || ''}, ${order.City}, ${order.State}, ${order.ZipCode}`;

            const shippingMethodCell = document.createElement('td');
            shippingMethodCell.textContent = order.ShippingMethod;

            const statusCell = document.createElement('td');
            statusCell.textContent = order.PaymentStatus;

            const amountCell = document.createElement('td');
            amountCell.textContent = `$${order.TotalAmount.toFixed(2)}`;

            const cardNumberCell = document.createElement('td');
            cardNumberCell.textContent = `**** **** **** ${order.CardNumber.slice(-4)}`; // Only show last 4 digits

            const expirationDateCell = document.createElement('td');
            expirationDateCell.textContent = order.ExpirationDate;

            const billingZipCell = document.createElement('td');
            billingZipCell.textContent = order.BillingZipCode;

            const transactionDateCell = document.createElement('td');
            transactionDateCell.textContent = new Date(order.TransactionDateTime).toLocaleString();

            const authTokenCell = document.createElement('td');
            authTokenCell.textContent = order.AuthorizationToken;

            const authAmountCell = document.createElement('td');
            authAmountCell.textContent = `$${order.AuthorizationAmount.toFixed(2)}`;

            const authExpiryCell = document.createElement('td');
            authExpiryCell.textContent = new Date(order.AuthorizationExpirationDate).toLocaleString();

            // Append cells to the row
            row.appendChild(orderIdCell);
            row.appendChild(customerCell);
            row.appendChild(emailCell);
            row.appendChild(addressCell);
            row.appendChild(shippingMethodCell);
            row.appendChild(statusCell);
            row.appendChild(amountCell);
            row.appendChild(cardNumberCell);
            row.appendChild(expirationDateCell);
            row.appendChild(billingZipCell);
            row.appendChild(transactionDateCell);
            row.appendChild(authTokenCell);
            row.appendChild(authAmountCell);
            row.appendChild(authExpiryCell);

            orderTableBody.appendChild(row);
        });
    }

    // Function to filter the orders based on customer name, order ID, or status
    function filterOrders() {
        const filterValue = searchInput.value.toLowerCase();
        const statusValue = statusFilter.value.toLowerCase();
        const rows = orderTableBody.getElementsByTagName('tr');
    
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const orderIdCell = row.cells[0].textContent.toLowerCase();
            const customerCell = row.cells[1].textContent.toLowerCase();
            const emailCell = row.cells[2].textContent.toLowerCase();
            const statusCell = row.cells[5].textContent.toLowerCase();
    
            const matchesOrderId = orderIdCell.includes(filterValue);
            const matchesCustomer = customerCell.includes(filterValue);
            const matchesEmail = emailCell.includes(filterValue);
            const matchesStatus = !statusValue || statusCell.includes(statusValue);
    
            if ((matchesOrderId || matchesCustomer || matchesEmail) && matchesStatus) {
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

            if (column === 6 || column === 11) { // If sorting by amount or authorization amount
                return parseFloat(valueA.slice(1)) - parseFloat(valueB.slice(1));
            }

            return valueA.localeCompare(valueB); // For other columns, use alphabetical sorting
        });

        // Reorder the rows in the table
        rows.forEach(row => orderTableBody.appendChild(row));
    }
});
