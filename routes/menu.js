const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const menuController = require('../controllers/menuController');

// READ: Get all menu items (public for students, all items for admin)
router.get('/', menuController.getMenuItems);

// READ: Get single menu item
router.get('/:_id', menuController.getMenuItemById);

// CREATE: Add menu item (Admin only)
router.post('/', authMiddleware, adminMiddleware, validate('createMenuItem'), menuController.createMenuItem);

// UPDATE: Edit menu item (Admin only)
router.put('/:_id', authMiddleware, adminMiddleware, validate('updateMenuItem'), menuController.updateMenuItem);

// DELETE: Mark menu item unavailable (Admin only)
router.delete('/:_id', authMiddleware, adminMiddleware, menuController.deleteMenuItem);

module.exports = router;
