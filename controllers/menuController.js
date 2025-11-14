const MenuItem = require('../models/MenuItem');

// CREATE: Add new menu item (Admin only)
exports.createMenuItem = async (req, res) => {
  try {
    const { name, description, price, category, image, available } = req.validated;

    const newMenuItem = new MenuItem({
      name,
      description,
      price,
      category,
      image,
      available: available !== undefined ? available : true,
      createdBy: req.userId
    });

    await newMenuItem.save();

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: newMenuItem
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create menu item', 
      error: error.message 
    });
  }
};

// READ: Get all menu items (available for students, all for admins)
exports.getMenuItems = async (req, res) => {
  try {
    const query = req.userRole === 'admin' ? {} : { available: true };
    const { category, search, page = 1, limit = 10 } = req.query;

    // Apply filters
    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;

    const items = await MenuItem.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await MenuItem.countDocuments(query);

    res.status(200).json({
      success: true,
      data: items,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch menu items', 
      error: error.message 
    });
  }
};

// READ: Get single menu item
exports.getMenuItemById = async (req, res) => {
  try {
    const { menuId } = req.params;

    const menuItem = await MenuItem.findOne({ menuId });

    if (!menuItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Menu item not found' 
      });
    }

    res.status(200).json({
      success: true,
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch menu item', 
      error: error.message 
    });
  }
};

// UPDATE: Edit menu item (Admin only)
exports.updateMenuItem = async (req, res) => {
  try {
    const { _id } = req.params;
    const updateData = req.validated;

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Menu item not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item updated successfully',
      data: menuItem
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update menu item', 
      error: error.message 
    });
  }
};

// DELETE: Mark menu item unavailable (Soft delete - Admin only)
exports.deleteMenuItem = async (req, res) => {
  try {
    const { menuId } = req.params;

    const menuItem = await MenuItem.findOneAndUpdate(
      { menuId },
      { available: false },
      { new: true }
    );

    if (!menuItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Menu item not found' 
      });
    }

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete menu item', 
      error: error.message 
    });
  }
};
