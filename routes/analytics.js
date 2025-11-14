const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const analyticsController = require('../controllers/analyticsController');

// All analytics endpoints - Admin only
router.get('/most-ordered', authMiddleware, adminMiddleware, analyticsController.getMostOrderedItems);
router.get('/daily-sales', authMiddleware, adminMiddleware, analyticsController.getDailySalesSummary);
router.get('/revenue-per-item', authMiddleware, adminMiddleware, analyticsController.getRevenuePerMenuItem);
router.get('/average-order-value', authMiddleware, adminMiddleware, analyticsController.getAverageOrderValue);
router.get('/status-distribution', authMiddleware, adminMiddleware, analyticsController.getOrderStatusDistribution);
router.get('/category-sales', authMiddleware, adminMiddleware, analyticsController.getCategoryWiseSales);

module.exports = router;
