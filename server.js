// Import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config(); // For loading environment variables

// Initialize express app
const app = express();

// Middleware for parsing JSON bodies
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (like CSS, JS, HTML)

// Connect to MongoDB using environment variables
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.log('MongoDB connection error:', err));

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to Wild Path Outfitters API!');
});

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
    const { firstName, lastName, address, cardDetails } = req.body;

    // Auto-generate orderId for new orders
    const orderId = 'WP-' + Math.floor(100000 + Math.random() * 900000);

    // Mock Endpoint URLs (currently commented out for bypass)
    /*
    const mockEndpointSuccess = 'https://run.mocky.io/v3/266bd809-da31-49a2-9e05-7a379d941741';
    const mockEndpointFailureDetails = 'https://run.mocky.io/v3/023b1b8c-c9dd-40a5-a3bd-b21bcde402d4';
    const mockEndpointFailureFunds = 'https://run.mocky.io/v3/ef002405-2fd7-4c62-87ee-42b0142cc588';

    // Determine mock URL based on card details (simulated)
    let mockUrl = mockEndpointSuccess;
    if (cardDetails.number.startsWith('4111')) {
        mockUrl = mockEndpointSuccess;
    } else if (cardDetails.number.startsWith('5105')) {
        mockUrl = mockEndpointFailureDetails;
    } else {
        mockUrl = mockEndpointFailureFunds;
    }

    // Uncomment and restore this once the mock endpoints are available
    const response = await fetch(mockUrl);
    const data = await response.json();
    */

    try {
        // Bypass mock endpoint and simulate a successful payment
        const mockToken = 'mockToken123'; // Mock token for now
        const authorizedAmount = 50.00;   // Mock authorized amount for now
        const tokenExpirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Mock token expiration (1 week)

        // Store transaction details in MongoDB
        const newOrder = new Order({
            orderId,
            firstName,
            lastName,
            address,
            cardDetails: {
                number: cardDetails.number.slice(-4), // Only save the last 4 digits
                expirationDate: cardDetails.expirationDate,
                cvv: cardDetails.cvv,
                zipCode: cardDetails.zipCode
            },
            authorizationToken: mockToken, // Mock token used for bypass
            authorizedAmount: authorizedAmount,
            tokenExpirationDate: tokenExpirationDate,
            transactionDateTime: new Date(),
            status: 'Success' // Mark as Success in bypass
        });

        await newOrder.save();

        // Send response back to the client
        res.json({
            message: 'Payment Authorized (bypass)',
            authorizationToken: mockToken,
            authorizedAmount: authorizedAmount,
            tokenExpirationDate: tokenExpirationDate
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
        const order = await Order.findOne({ orderId });

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
