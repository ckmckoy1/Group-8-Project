// Import dependencies
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import helmet from 'helmet';
import fetch from 'node-fetch'; // Ensure this is installed

// Initialize dotenv to read environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(helmet());
app.use(morgan('combined')); // Logs requests to your console
app.use(compression());
app.use(cors({
    origin: ['https://ckmckoy1.github.io', 'https://group8-a70f0e413328.herokuapp.com'], // Allow requests from GitHub Pages and Heroku
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (like CSS, JS, HTML from public folder)


// MongoDB connection with a longer timeout (10s) to prevent Heroku timeout issues
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/WildPathOutfitters', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000 // Increase timeout for MongoDB to 10 seconds
})
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        console.error('Make sure your credentials and IP whitelisting are correct.');
    });

// Root route to confirm the server is up and running
app.get('/', (req, res) => {
    res.send('Welcome to Wild Path Outfitters API!');
});

// Define Mongoose schema and models
const orderSchema = new mongoose.Schema({
    OrderID: String,  
    CustomerEmail: String,
    FirstName: String,
    LastName: String,
    StreetAddress: String,
    UnitNumber: String,
    City: String,
    State: String,
    ZipCode: String,
    ShippingMethod: String,
    ShippingAddress: String,
    ShippingCity: String,
    ShippingState: String,
    ShippingZip: String,
    TotalAmount: Number,
    PaymentStatus: String,
    CardNumber: String,  // Store the last 4 digits only
    CardBrand: String,
    ExpirationDate: String,
    BillingZipCode: String,
    AuthorizationToken: String,
    OrderDateTime: Date,
    OrderDate: Date,
    OrderTime: String,
    AuthorizationAmount: Number,
    AuthorizationExpirationDate: Date,  // Use Date instead of String for consistency
    WarehouseStatus: String,
    WarehouseApprovalDate: Date,
});

module.exports = mongoose.model('Order', orderSchema);


// Add index on OrderID to optimize querying by OrderID
orderSchema.index({ OrderID: 1 });

// Use WP-Orders collection within the WildPathOutfitters database
const Order = mongoose.model('Order', orderSchema, 'WP-Orders');

// API route to get a specific order by orderId (new route)
app.get('/api/orders/:orderId', async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await Order.findOne({ OrderID: orderId });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve order', error: err.message });
    }
});


// Route to handle order creation and authorization
app.post('/api/checkout', async (req, res) => {
    const { firstName, lastName, address, cardDetails } = req.body;

    // Auto-generate orderId for new orders
    const orderId = 'WP-' + Math.floor(100000 + Math.random() * 900000);

    // Mock Endpoint URLs
    const mockEndpointSuccess = 'https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=success';
    const mockEndpointFailureDetails = 'https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=carddetails';
    const mockEndpointFailureFunds = 'https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=insufficient';

    // Determine mock URL based on card details (simulated)
    let mockUrl;
    if (cardDetails.number.startsWith('4111')) {
        mockUrl = mockEndpointSuccess;
    } else if (cardDetails.number.startsWith('5105')) {
        mockUrl = mockEndpointFailureDetails;
    } else {
        mockUrl = mockEndpointFailureFunds;
    }

    try {
        // Send a request to the mock payment endpoint
        const responseStart = Date.now(); // Start tracking time for the external request
        const response = await fetch(mockUrl, { method: 'POST' });
        const data = await response.json();
        console.log(`Mock payment request took ${Date.now() - responseStart}ms`); // Log how long the mock payment request took

        // If the payment is successful, store the order details in MongoDB
        if (data.Success) {
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
                authorizationToken: data.AuthorizationToken,
                authorizedAmount: data.AuthorizedAmount,
                tokenExpirationDate: new Date(data.TokenExpirationDate),
                transactionDateTime: new Date(),
                status: 'Success'
            });

            const saveStart = Date.now(); // Track how long saving to MongoDB takes
            await newOrder.save();
            console.log(`Saving order to MongoDB took ${Date.now() - saveStart}ms`);

            // Send response back to the client
            res.json({
                message: 'Payment authorized successfully!',
                orderId: newOrder.orderId,
                authorizationToken: data.AuthorizationToken,
                authorizedAmount: data.AuthorizedAmount,
                tokenExpirationDate: data.TokenExpirationDate
            });
        } else {
            // Handle payment failure cases
            res.status(400).json({
                message: `Payment failed: ${data.Reason}`
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error during payment processing', error: error.message });
    }
});

// Route to fetch all orders (for Order Management UI)
app.get('/api/orders', async (req, res) => {
    try {
        const fetchStart = Date.now(); // Track how long it takes to fetch orders
        const orders = await Order.find();  // Fetch all orders from WP-Orders collection
        console.log(`Fetching all orders took ${Date.now() - fetchStart}ms`);
        res.json(orders);  // Send the orders to the frontend
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve orders', error: err.message });
    }
});

// Route for Warehouse UI to settle orders
app.post('/api/settle-shipment', async (req, res) => {
    console.log('Settle shipment route hit');
    
    const { orderId, finalAmount } = req.body;
    console.log('Order ID being searched:', orderId); // Log orderId for debugging

    try {
        // Fetch the order from MongoDB using the correct field name "OrderID"
        const order = await Order.findOne({ OrderID: orderId });

        if (!order) {
            console.log('Order not found'); // Log if the order is not found
            return res.status(404).json({ message: 'Order not found' });
        }

        console.log('Order found:', order); // Log the order details if found
        const authorizationAmount = order.AuthorizationAmount; // Ensure proper capitalization

        // Check if the order has already been settled
        if (order.WarehouseStatus === 'Settled') {
            console.log('Order has already been settled');
            return res.status(400).json({ message: 'Order has already been settled. No further action is allowed.' });
        }

        // Check if the final amount matches the authorized amount
        if (finalAmount !== authorizationAmount) {
            console.log(`Final amount does not match authorized amount: ${finalAmount} !== ${authorizationAmount}`);
            return res.status(400).json({ message: 'Unable to approve. Final amount does not match the authorized amount.' });
        }

        // If amounts match, mark the order as settled
        if (finalAmount === authorizationAmount) {
            order.WarehouseStatus = 'Settled'; // Ensure correct capitalization
            await order.save();

            console.log('Order successfully settled');
            return res.json({ message: 'Order successfully settled.' });
        }

    } catch (err) {
        console.error('Error during shipment settlement:', err.message);
        return res.status(500).json({ message: 'Unable to access the database.', error: err.message });
    }
});



// Catch-all route for undefined paths
app.use((req, res) => {
    res.status(404).send({ message: 'Resource not found!' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
