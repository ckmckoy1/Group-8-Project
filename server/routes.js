const express = require('express');
const router = express.Router();
const Order = require('./orderModel');
const Transaction = require('./transactionModel');
const axios = require('axios');

// Route to create a new order
router.post('/order', async (req, res) => {
    try {
        const { firstName, lastName, address, totalAmount } = req.body;

        // Auto-generate orderId
        const orderId = 'NS-' + Math.floor(100000 + Math.random() * 900000);

        const newOrder = new Order({
            orderId,
            firstName,
            lastName,
            address,
            totalAmount,
            paymentStatus: 'Pending'
        });

        await newOrder.save();
        res.status(201).json({ message: 'Order created successfully', orderId });
    } catch (err) {
        res.status(500).json({ error: 'Error creating the order' });
    }
});

// Route to handle payment authorization
router.post('/authorize-payment', async (req, res) => {
    const { orderId, cardNumber, expDate, securityCode, totalAmount } = req.body;

    try {
        // Find the order by orderId
        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Prepare the payload for the mock endpoint
        const payload = {
            OrderId: orderId,
            CardDetails: {
                Number: cardNumber,
                ExpirationDate: expDate,
                CVC: securityCode,
                NameOnCard: `${order.firstName} ${order.lastName}`
            },
            AuthorizationAmount: totalAmount
        };

        // Call the mock endpoint for payment authorization
        const response = await axios.post('https://run.mocky.io/v3/266bd809-da31-49a2-9e05-7a379d941741', payload);

        const { Success, AuthorizationToken, TokenExpirationDate, AuthorizedAmount } = response.data;

        if (Success) {
            // Update the order and save transaction details on success
            order.paymentStatus = 'Authorized';
            order.authorizedAmount = AuthorizedAmount;
            order.authorizationToken = AuthorizationToken;
            order.tokenExpirationDate = TokenExpirationDate;
            await order.save();

            const newTransaction = new Transaction({
                orderId,
                authorizationToken: AuthorizationToken,
                authorizationAmount: AuthorizedAmount,
                authorizationExpirationDate: TokenExpirationDate,
                transactionDateTime: new Date()
            });
            await newTransaction.save();

            res.status(200).json({ message: 'Payment authorized successfully', AuthorizationToken });
        } else {
            order.paymentStatus = 'Failed';
            await order.save();
            res.status(400).json({ error: 'Payment authorization failed' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error processing payment' });
    }
});

// Route to list all orders with payment status
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find();
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching orders' });
    }
});

// Route for warehouse to settle an order
router.post('/settle-order', async (req, res) => {
    const { orderId, finalAmount } = req.body;

    try {
        // Find the order by orderId
        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if the final amount is less than or equal to the authorized amount
        if (finalAmount > order.authorizedAmount) {
            return res.status(400).json({ error: 'Final amount exceeds authorized amount' });
        }

        // Mark the order as settled
        order.paymentStatus = 'Settled';
        await order.save();

        res.status(200).json({ message: 'Order settled successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Error settling the order' });
    }
});

module.exports = router;
