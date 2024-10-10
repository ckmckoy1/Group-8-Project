// server.js

// Import dependencies using require (CommonJS)
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const fetch = require('node-fetch'); // Ensure this is imported

// Initialize dotenv to read environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(helmet());
app.use(morgan('combined')); // Logs requests to your console
app.use(compression());
app.use(
  cors({
    origin: [
      'https://ckmckoy1.github.io',
      'https://group8-a70f0e413328.herokuapp.com',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
    optionsSuccessStatus: 200, // Some legacy browsers choke on status 204
  })
);

app.use(bodyParser.json());
app.use(express.static('public')); // Serve static files (like CSS, JS, HTML from public folder)

// MongoDB connection with a longer timeout (10s) to prevent Heroku timeout issues
mongoose
  .connect(
    process.env.MONGODB_URI ||
      'mongodb://127.0.0.1:27017/WildPathOutfitters',
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000, // Increase timeout for MongoDB to 10 seconds
    }
  )
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.error(
      'Make sure your credentials and IP whitelisting are correct.'
    );
  });

// Root route to confirm the server is up and running
app.get('/', (req, res) => {
  res.send('Welcome to Wild Path Outfitters API!');
});

// Define Mongoose schemas and models

// 1. CreditCard Schema and Model
const creditCardSchema = new mongoose.Schema({
  CardNumber: String,
  ExpirationDate: String,
  CVV: String,
  BillingName: String,
  Zip: String,
  FundsAvailable: Number,
  CardBrand: String,
  MockEndpoint: String,
});

const CreditCard = mongoose.model(
  'CreditCard',
  creditCardSchema,
  'Credit-Card-Sample'
);

// 2. Order Schema and Model
const orderSchema = new mongoose.Schema({
  OrderID: String,
  CustomerEmail: String,
  FirstName: String,
  LastName: String,

  // Billing Information
  BillingAddress: String,
  BillingUnitNumber: String,
  BillingCity: String,
  BillingState: String,
  BillingZipCode: String,

  // Shipping Information
  ShippingMethod: String,
  ShippingAddress: String,
  ShippingUnitNumber: String,
  ShippingCity: String,
  ShippingState: String,
  ShippingZip: String,

  TotalAmount: Number,
  PaymentStatus: String,
  CardNumber: String, // Store the last 4 digits only
  CardBrand: String,
  ExpirationDate: String,

  AuthorizationToken: String,
  OrderDateTime: Date,
  OrderDate: Date,
  OrderTime: String,
  AuthorizationAmount: Number,
  AuthorizationExpirationDate: Date,

  WarehouseStatus: String,
  WarehouseApprovalDate: Date,

  PaymentResult: mongoose.Schema.Types.Mixed, // To store the paymentResult object
});

// Add index on OrderID to optimize querying by OrderID
orderSchema.index({ OrderID: 1 });

// Use WP-Orders collection within the WildPathOutfitters database
const Order = mongoose.model('Order', orderSchema, 'WP-Orders');

// Export the Order model
module.exports = Order;

// API route to get a specific order by OrderID
app.get('/api/orders/:orderId', async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await Order.findOne({ OrderID: orderId }).select('-__v'); // Exclude the __v field from the result
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        res.json(order);  // The response will not include the __v field
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve order', error: err.message });
    }
});


// Route to handle order creation and authorization
app.post('/api/checkout', async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    shippingAddress,
    shippingMethod,
    billingAddress,
    paymentDetails,
    orderTotal,
  } = req.body;

  // Auto-generate OrderID for new orders
  const orderId = 'WP-' + Math.floor(100000 + Math.random() * 900000);

  try {
    // Step 1: Validate card details against Credit-Card-Sample collection
    const card = await CreditCard.findOne({
      CardNumber: paymentDetails.cardNumber,
      ExpirationDate: paymentDetails.expDate,
      CVV: paymentDetails.cvv,
      BillingName: paymentDetails.cardHolderName,
      Zip: billingAddress.zipCode,
    });

    let paymentResult = {}; // We'll use the response from the mock endpoint

    if (!card) {
      // Card details are incorrect
      const response = await fetch(
        'https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=carddetails'
      );
      const data = await response.json();

      paymentResult = data;
    } else if (orderTotal > card.FundsAvailable) {
      // Insufficient funds
      const response = await fetch(
        'https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=insufficient'
      );
      const data = await response.json();

      paymentResult = data;
    } else {
      // Successful transaction
      const response = await fetch(
        'https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=success'
      );
      const data = await response.json();

      paymentResult = data;

      // Update FundsAvailable in CreditCard document
      card.FundsAvailable -= orderTotal;
      await card.save();
    }

    // Since the mock endpoints include "OrderId", which we don't need, we can ignore it
    // Also, replace any placeholder data in the response (like "ORD000123") with actual data
    // For example, adjust the Reason to include the last 4 digits of the card number

    // Modify paymentResult to include actual card information
    if (paymentResult.Reason) {
      paymentResult.Reason = paymentResult.Reason.replace(
        'XXXX',
        paymentDetails.cardNumber.slice(-4)
      );
    }

        // Map paymentResult fields to existing order fields
        const paymentStatus = paymentResult.Success ? 'Authorized' : 'Failed';
        const authorizationToken = paymentResult.AuthorizationToken || null;
        const authorizationAmount = paymentResult.AuthorizedAmount || null;
        const authorizationExpirationDate = paymentResult.TokenExpirationDate
            ? new Date(paymentResult.TokenExpirationDate)
            : null;

// Now create a new order document, including paymentResult
const orderDateTime = new Date();  // Current date and time
const orderDate = orderDateTime.toISOString().split('T')[0];  // Extract the date part (YYYY-MM-DD)
const orderTime = orderDateTime.toTimeString().split(' ')[0];  // Extract the time part (HH:MM:SS)

// Ensure consistent date format by storing dates as ISO strings
const newOrder = new Order({
  OrderID: orderId,
  CustomerEmail: email,
  FirstName: firstName,
  LastName: lastName,

  // Shipping Information
  ShippingMethod: shippingMethod,
  ShippingAddress: shippingAddress.address,
  ShippingCity: shippingAddress.city,
  ShippingState: shippingAddress.state,
  ShippingZip: shippingAddress.zip,
  ShippingUnitNumber: shippingAddress.unitNumber,

  // Billing Information
  BillingAddress: billingAddress.address,
  BillingCity: billingAddress.city,
  BillingState: billingAddress.state,
  BillingZipCode: billingAddress.zipCode,
  BillingUnitNumber: billingAddress.unitNumber,

  // Payment and Order Details
  TotalAmount: orderTotal,
  PaymentStatus: paymentResult.Success ? 'Authorized' : 'Failed',
  CardNumber: paymentDetails.cardNumber.slice(-4), // Store last 4 digits only
  CardBrand: paymentDetails.cardBrand,
  ExpirationDate: paymentDetails.expDate,
  AuthorizationToken: paymentResult.AuthorizationToken
    ? `${orderId}_${paymentResult.AuthorizationToken}`
    : null,
  
  // Store dates as ISO strings to avoid the $date format issue
  OrderDateTime: orderDateTime.toISOString(),  // Full date and time as ISO string
  OrderDate: orderDate,  // Date part as ISO string
  OrderTime: orderTime,  // Time part
  
  AuthorizationAmount: paymentResult.AuthorizedAmount || null,
  AuthorizationExpirationDate: paymentResult.TokenExpirationDate
    ? new Date(paymentResult.TokenExpirationDate).toISOString()
    : null,
  WarehouseStatus: 'Pending',
  WarehouseApprovalDate: null,
});


    await newOrder.save();

    res.json({
      message: paymentResult.Success
        ? 'Order saved successfully!'
        : `Order failed: ${paymentResult.Reason}`,
      orderId: orderId,
    });
  } catch (error) {
    console.error('Error during order processing:', error.message);
    res.status(500).json({
      message: 'Server error during order processing',
      error: error.message,
    });
  }
});

// Route to fetch all orders (for Order Management UI)
app.get('/api/orders', async (req, res) => {
    try {
      const fetchStart = Date.now(); // Track how long it takes to fetch orders
      const orders = await Order.find().select('-__v'); // Exclude the __v field
      console.log(`Fetching all orders took ${Date.now() - fetchStart}ms`);
      res.json(orders); // Send the orders to the frontend
    } catch (err) {
      res
        .status(500)
        .json({ message: 'Failed to retrieve orders', error: err.message });
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
      return res.status(400).json({
        message: 'Order has already been settled. No further action is allowed.',
      });
    }

    // Check if the final amount matches the authorized amount
    if (finalAmount !== authorizationAmount) {
      console.log(
        `Final amount does not match authorized amount: ${finalAmount} !== ${authorizationAmount}`
      );
      return res.status(400).json({
        message:
          'Unable to approve. Final amount does not match the authorized amount.',
      });
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
    return res
      .status(500)
      .json({ message: 'Unable to access the database.', error: err.message });
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
