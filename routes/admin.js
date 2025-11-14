const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// READ: Get all orders (Admin only)
router.get('/orders/all', authMiddleware, adminMiddleware, orderController.getAllOrders);

// UPDATE: Change order status (Admin only)
router.patch('/orders/:orderId/status', authMiddleware, adminMiddleware, orderController.updateOrderStatus);

module.exports = router;
