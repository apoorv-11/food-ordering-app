const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const MenuItem = require('../models/MenuItem');

// CREATE: Place new order (Student)
exports.createOrder = async (req, res) => {
  try {
    let { items, pickupTime, specialInstr } = req.validated;
    const userId = req.userId;

    // STORE: Expect pickupTime as UTC ISO string (e.g., 2025-11-17T10:30:00Z)
    const finalPickupTime = new Date(pickupTime);
    if (isNaN(finalPickupTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: "pickupTime must be a valid UTC ISO 8601 string",
      });
    }

    // ... rest of your code, unchanged ...
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuId);

      if (!menuItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item with ID ${item.menuId} not found`,
        });
      }
      if (!menuItem.available) {
        return res.status(400).json({
          success: false,
          message: `Menu item ${menuItem.name} is not available`,
        });
      }
      totalAmount += menuItem.price * item.quantity;
      orderItemsData.push({
        menuId: menuItem._id,
        quantity: item.quantity,
        price: menuItem.price,
      });
    }

    const newOrder = new Order({
      userId,
      totalAmount,
      status: "placed",
      pickupTime: finalPickupTime,
      specialInstr: specialInstr || "",
    });
    await newOrder.save();

    for (const itemData of orderItemsData) {
      const newOrderItem = new OrderItem({
        orderId: newOrder._id,
        menuId: itemData.menuId,
        quantity: itemData.quantity,
        price: itemData.price,
      });
      await newOrderItem.save();
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: newOrder,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to place order",
      error: error.message,
    });
  }
};

// READ: Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments({ userId });

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const orderItems = await OrderItem.find({ orderId: order._id })
          .populate('menuId');
        return {
          ...order.toObject(),
          items: orderItems
        };
      })
    );

    res.status(200).json({
      success: true,
      data: ordersWithItems,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders', 
      error: error.message 
    });
  }
};

// READ: Get all orders (Admin only)
exports.getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(query);

    // Fetch order items and user info
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const orderItems = await OrderItem.find({ orderId: order.orderId })
          .populate('menuId');
        return {
          ...order.toObject(),
          items: orderItems
        };
      })
    );

    res.status(200).json({
      success: true,
      data: ordersWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch orders', 
      error: error.message 
    });
  }
};

// READ: Get single order
exports.getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check authorization (student can only see their own orders)
    if (req.userRole === 'student' && order.userId !== req.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to view this order' 
      });
    }

    const orderItems = await OrderItem.find({ orderId });

    res.status(200).json({
      success: true,
      data: {
        ...order.toObject(),
        items: orderItems
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch order', 
      error: error.message 
    });
  }
};

// UPDATE: Edit order (Before preparation - Student only)
exports.updateOrder = async (req, res) => {
  try {
    const { _id } = req.params;
    const { items, pickupTime, specialInstr } = req.validated;
    const userId = req.userId;

    // Find order
    const order = await Order.findOne({ _id });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check ownership (student can only edit their own orders)
    if (req.userRole === 'student' && order.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to edit this order' 
      });
    }

    // Check order status (can only edit if placed)
    if (order.status !== 'placed') {
      return res.status(409).json({ 
        success: false, 
        message: `Cannot edit order with status: ${order.status}. Only 'placed' orders can be edited.` 
      });
    }

    // If items provided, recalculate total
    if (items && items.length > 0) {
      let totalAmount = 0;

      for (const item of items) {
        const menuItem = await MenuItem.findOne({ menuId: item.menuId });

        if (!menuItem) {
          return res.status(404).json({ 
            success: false, 
            message: `Menu item ${item.menuId} not found` 
          });
        }

        totalAmount += menuItem.price * item.quantity;
      }

      // Delete old items
      await OrderItem.deleteMany({ orderId });

      // Create new items
      for (const item of items) {
        const menuItem = await MenuItem.findOne({ menuId: item.menuId });
        const newOrderItem = new OrderItem({
          orderId,
          menuId: item.menuId,
          quantity: item.quantity,
          price: menuItem.price
        });
        await newOrderItem.save();
      }

      order.totalAmount = totalAmount;
    }

    // Update other fields
    if (pickupTime) order.pickupTime = pickupTime;
    if (specialInstr !== undefined) order.specialInstr = specialInstr;

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update order', 
      error: error.message 
    });
  }
};

// UPDATE: Change order status (Admin only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['placed', 'preparing', 'ready', 'completed', 'canceled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const allowedTransitions = {
      'placed': ['preparing', 'canceled'],
      'preparing': ['ready', 'canceled'],
      'ready': ['completed'],
      'completed': [],
      'canceled': []
    };

    if (!allowedTransitions[order.status].includes(status)) {
      return res.status(409).json({
        success: false,
        message: `Cannot transition from ${order.status} to ${status}`
      });
    }

    if (status === 'preparing' && !order.startedAt) {
      order.startedAt = new Date();
    }

    if (status === 'completed') {
      order.completedAt = new Date();
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// DELETE: Cancel order (Student can cancel own orders before preparing, Admin can cancel any)
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.userId;

    const order = await Order.findOne({ orderId });

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found' 
      });
    }

    // Check ownership for students
    if (req.userRole === 'student' && order.userId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to cancel this order' 
      });
    }

    // Check if order can be canceled
    if (!['placed', 'preparing'].includes(order.status)) {
      return res.status(409).json({ 
        success: false, 
        message: `Cannot cancel order with status: ${order.status}` 
      });
    }

    order.status = 'canceled';
    order.updatedAt = new Date();
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order canceled successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel order', 
      error: error.message 
    });
  }
};
