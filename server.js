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
    origin: ['https://ckmckoy1.github.io', 'https://group8-a70f0e413328.herokuapp.com'] // Allow requests from GitHub Pages and Heroku
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
    orderId: String,
    firstName: String,
    lastName: String,
    address: String,
    cardDetails: {
        number: String, // Only last 4 digits are saved for security
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

// Add index on orderId to optimize querying by orderId
orderSchema.index({ orderId: 1 }); // Creates an index on the orderId field

// Use WP-Orders collection within the WildPathOutfitters database
const Order = mongoose.model('Order', orderSchema, 'WP-Orders');

// Route to handle order creation and authorization
app.post('/api/checkout', async (req, res) => {
    const { firstName, lastName, address, cardDetails } = req.body;

    // Auto-generate orderId for new orders
    const orderId = 'WP-' + Math.floor(100000 + Math.random() * 900000);

    // Mock Endpoint URLs
    const mockEndpointSuccess = 'https://run.mocky.io/v3/b4e53431-c19e-4853-93c9-03d1cdd1e6f3';
    const mockEndpointFailureDetails = 'https://run.mocky.io/v3/52371a52-83fc-4edd-84d1-bfeee1a5f448';
    const mockEndpointFailureFunds = 'https://run.mocky.io/v3/9027a69f-0b17-4f9d-912f-16e0342c1b38';

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
        // Fetch the order from MongoDB using "OrderID" (case-sensitive)
        const queryStart = Date.now();
        const order = await Order.findOne({ OrderID: orderId }); // Corrected query field to "OrderID"
        console.log(`Query took ${Date.now() - queryStart}ms`);

        // If the order is not found
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const authorizationAmount = order.authorizedAmount;

        // If the final amount is greater than the authorized amount
        if (finalAmount > authorizationAmount) {
            return res.status(400).json({ message: 'Unable to approve. Final amount exceeds authorized amount.' });
        }

        // If the final amount is less than the authorized amount
        if (finalAmount < authorizationAmount) {
            const remainingBalance = authorizationAmount - finalAmount;
            // Update MongoDB to mark the order as "Partial Settlement"
            order.WarehouseStatus = 'Partial Settlement';
            const saveStart = Date.now();
            await order.save();
            console.log(`Saving partial settlement to MongoDB took ${Date.now() - saveStart}ms`);

            return res.json({
                message: `Partial settlement processed. Remaining balance: $${remainingBalance}. There is still a balance remaining on the account.`,
                remainingBalance
            });
        }

        // If the final amount is equal to the authorized amount
        if (finalAmount === authorizationAmount) {
            // Update MongoDB to mark the order as "Settled"
            order.WarehouseStatus = 'Settled';
            const saveStart = Date.now();
            await order.save();
            console.log(`Saving settlement to MongoDB took ${Date.now() - saveStart}ms`);

            return res.json({ message: 'Order successfully settled.' });
        }
    } catch (err) {
        // Handle MongoDB connection or processing errors
        res.status(500).json({ message: 'Unable to access the database.', error: err.message });
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
