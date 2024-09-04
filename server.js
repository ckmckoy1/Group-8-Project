// Import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fetch = require('node-fetch'); // For making external API requests
const Order = require('./models/orderModel'); // Assuming you've defined this in a model file

const app = express();

// Middleware for parsing JSON bodies
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (like CSS, JS, HTML)

// Connect to MongoDB (replace <db_uri> with your MongoDB URI)
mongoose.connect('<db_uri>', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log(err));

// Define Mongoose schema and models
const orderSchema = new mongoose.Schema({
    orderId: String,
    firstName: String,
    lastName: String,
    address: String,
    cardDetails: {
        number: String,
        expirationDate: String,
        cvv: String,
        zipCode: String
    },
    authorizationToken: String,
    authorizedAmount: Number,
    tokenExpirationDate: Date,
    transactionDateTime: Date,
    status: String // Success or Failure
});

const Order = mongoose.model('Order', orderSchema);

// Route to handle order creation and authorization
app.post('/api/checkout', async (req, res) => {
    const { orderId, firstName, lastName, address, cardDetails } = req.body;
    
    const mockEndpointSuccess = 'https://run.mocky.io/v3/266bd809-da31-49a2-9e05-7a379d941741';
    const mockEndpointFailureDetails = 'https://run.mocky.io/v3/023b1b8c-c9dd-40a5-a3bd-b21bcde402d4';
    const mockEndpointFailureFunds = 'https://run.mocky.io/v3/ef002405-2fd7-4c62-87ee-42b0142cc588';

    // Call mock endpoint based on card details (simulated)
    let mockUrl = mockEndpointSuccess; // For example, set this dynamically based on validation
    if (cardDetails.number.startsWith('4111')) {
        mockUrl = mockEndpointSuccess;
    } else if (cardDetails.number.startsWith('5105')) {
        mockUrl = mockEndpointFailureDetails;
    } else {
        mockUrl = mockEndpointFailureFunds;
    }

    try {
        const response = await fetch(mockUrl);
        const data = await response.json();

        // Store the transaction in MongoDB
        const newOrder = new Order({
            orderId: orderId,
            firstName: firstName,
            lastName: lastName,
            address: address,
            cardDetails: {
                number: cardDetails.number.slice(-4), // Save only the last 4 digits
                expirationDate: cardDetails.expirationDate,
                cvv: cardDetails.cvv,
                zipCode: cardDetails.zipCode
            },
            authorizationToken: data.AuthorizationToken || null,
            authorizedAmount: data.AuthorizedAmount || 0,
            tokenExpirationDate: data.TokenExpirationDate || null,
            transactionDateTime: new Date(),
            status: data.Success ? 'Success' : 'Failure'
        });

        await newOrder.save();

        // Send response back to the client
        res.json({
            message: data.Success ? 'Payment Authorized' : 'Payment Failed',
            authorizationToken: data.AuthorizationToken,
            authorizedAmount: data.AuthorizedAmount,
            tokenExpirationDate: data.TokenExpirationDate
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error during payment processing', error: error.message });
    }
});

// Route to fetch all orders (for Order Management UI)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve orders', error: err.message });
    }
});

// Route for Warehouse UI to settle orders
app.post('/api/settle-shipment', async (req, res) => {
    const { orderId, finalAmount } = req.body;

    try {
        const order = await Order.findOne({ orderId: orderId });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (finalAmount > order.authorizedAmount) {
            return res.status(400).json({ message: 'Final amount exceeds authorized amount' });
        }

        order.status = 'Settled';
        await order.save();

        res.json({ message: 'Order successfully settled' });

    } catch (err) {
        res.status(500).json({ message: 'Failed to settle order', error: err.message });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
