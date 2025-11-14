const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const orderController = require('../controllers/orderController');

// CREATE: Place order (Student)
router.post('/', authMiddleware, validate('createOrder'), orderController.createOrder);

// READ: Get user's orders
router.get('/user/history', authMiddleware, orderController.getUserOrders);

// READ: Get single order
router.get('/:orderId', authMiddleware, orderController.getOrderById);

// UPDATE: Edit order (Before preparation - Student)
router.put('/:orderId', authMiddleware, validate('updateOrder'), orderController.updateOrder);

// DELETE: Cancel order
router.delete('/:orderId', authMiddleware, orderController.cancelOrder);

module.exports = router;
