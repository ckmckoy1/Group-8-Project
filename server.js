// server.js

// Import dependencies
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');

// For Node.js versions >= 18, 'fetch' is globally available.
// For earlier versions, uncomment the following line:
// const fetch = require('node-fetch');

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

// Order Schema and Model
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
  AuthorizationExpirationDate: Date,
  AuthorizationAmount: Number,

  OrderDateTime: Date,
  OrderDate: Date,
  OrderTime: String,

  WarehouseStatus: String,
  WarehouseApprovalDate: Date,

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
    res.json(order); // The response will not include the __v field
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve order', error: err.message });
  }
});

// Route to handle order creation and authorization
app.post('/api/checkout', async (req, res) => {
  console.log('Received checkout request:', req.body);
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
    testEndpoint, // Get the selected mock endpoint from the request body
  } = req.body;

  // Auto-generate OrderID for new orders
  const orderId = 'WP-' + Math.floor(100000 + Math.random() * 900000);

  try {
    // Check if testEndpoint is provided
    if (!testEndpoint) {
      return res.status(400).json({ message: 'Error: Test endpoint not specified.' });
    }

    let mockEndpointUrl = '';

    // Determine which mock endpoint to call based on testEndpoint
    switch (testEndpoint) {
      case 'success':
        mockEndpointUrl = 'https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=success';
        break;
      case 'insufficient':
        mockEndpointUrl = 'https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=insufficient';
        break;
      case 'incorrect':
        mockEndpointUrl = 'https://e7642f03-e889-4c5c-8dc2-f1f52461a5ab.mock.pstmn.io/get?authorize=carddetails';
        break;
      default:
        // Return an error response if testEndpoint is invalid
        return res.status(400).json({ message: 'Error: Invalid test endpoint specified.' });
    }

    // Make the API call to the selected mock endpoint
    const response = await fetch(mockEndpointUrl);
    const paymentResult = await response.json();

    // Replace 'XXXX' in Reason with the last 4 digits of the card number
    const last4Digits = paymentDetails.cardNumber.slice(-4);
    if (paymentResult.Reason) {
      paymentResult.Reason = paymentResult.Reason.replace('XXXX', last4Digits);
    }

    // Determine PaymentStatus and related fields based on paymentResult
    let paymentStatus;
    let authorizationAmount;
    let authorizationToken;
    let authorizationExpirationDate;
    let warehouseStatus;

    if (paymentResult.Success) {
      paymentStatus = 'Success';
      authorizationAmount = paymentResult.AuthorizedAmount || orderTotal;
      authorizationToken = paymentResult.AuthorizationToken ? paymentResult.AuthorizationToken : null;
      authorizationExpirationDate = paymentResult.TokenExpirationDate ? new Date(paymentResult.TokenExpirationDate) : null;
      warehouseStatus = 'Pending';
    } else {
      // Determine specific failure reason
      if (paymentResult.Reason && paymentResult.Reason.toLowerCase().includes('insufficient funds')) {
        paymentStatus = 'Failure - Insufficient Funds';
      } else if (paymentResult.Reason && paymentResult.Reason.toLowerCase().includes('card details incorrect')) {
        paymentStatus = 'Failure - Incorrect Card Details';
      } else {
        paymentStatus = 'Failure - Unknown Reason';
      }
      authorizationAmount = 0;
      authorizationToken = null;
      authorizationExpirationDate = null;
      warehouseStatus = 'N/A';
    }

    // Create a new order document, including mapped payment details
    const orderDateTime = new Date(); // Current date and time
    const orderDate = orderDateTime.toISOString().split('T')[0]; // Date part (YYYY-MM-DD)
    const orderTime = orderDateTime.toTimeString().split(' ')[0]; // Time part (HH:MM:SS)

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
      PaymentStatus: paymentStatus,
      CardNumber: last4Digits, // Store last 4 digits only
      CardBrand: paymentDetails.cardBrand,
      ExpirationDate: paymentDetails.expDate,
      AuthorizationToken: authorizationToken,
      AuthorizationExpirationDate: authorizationExpirationDate,
      AuthorizationAmount: authorizationAmount,
      OrderDateTime: orderDateTime, // Full date and time
      OrderDate: new Date(orderDate), // Date part as Date object
      OrderTime: orderTime, // Time part as string
      WarehouseStatus: warehouseStatus,
      WarehouseApprovalDate: null,
    });

    await newOrder.save();

    if (paymentResult.Success) {
      res.json({
        message: 'Order saved successfully!',
        orderId: orderId,
      });
    } else {
      // Send back the failure message
      res.status(400).json({
        message: `Order failed: ${paymentStatus.replace('Failure - ', '')}`,
        reason: paymentResult.Reason,
        orderId: orderId,
      });
    }
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
