// Import dependencies
const mongoose = require('mongoose');

// Define the order schema
const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Authorized', 'Failed', 'Settled'],
        default: 'Pending'
    },
    totalAmount: {
        type: Number,
        required: true
    },
    authorizedAmount: {
        type: Number,
        default: 0
    },
    authorizationToken: {
        type: String,
        default: null
    },
    tokenExpirationDate: {
        type: Date,
        default: null
    },
    transactionDateTime: {
        type: Date,
        default: Date.now
    }
});

// Create a model from the schema
const Order = mongoose.model('Order', orderSchema);

// Export the model for use in other files
module.exports = Order;
