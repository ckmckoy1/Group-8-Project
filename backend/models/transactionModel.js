// Import dependencies
const mongoose = require('mongoose');

// Define the transaction schema
const transactionSchema = new mongoose.Schema({
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
    cardDetails: {
        number: {
            type: String,
            required: true
        },
        expirationDate: {
            type: String,
            required: true
        },
        cvv: {
            type: String,
            required: true
        },
        zipCode: {
            type: String,
            required: true
        }
    },
    authorizationToken: {
        type: String,
        default: null
    },
    authorizedAmount: {
        type: Number,
        default: 0
    },
    tokenExpirationDate: {
        type: Date,
        default: null
    },
    transactionDateTime: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Success', 'Failure', 'Settled'],
        default: 'Failure'
    }
});

// Create a model from the schema
const Transaction = mongoose.model('Transaction', transactionSchema);

// Export the model for use in other files
module.exports = Transaction;
