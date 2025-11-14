const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const MenuItem = require('../models/MenuItem');

// Analytics: Most Ordered Items
exports.getMostOrderedItems = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const mostOrdered = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'menuitems',
          localField: 'menuId',
          foreignField: '_id',
          as: 'menuDetails'
        }
      },
      {
        $unwind: '$menuDetails'
      },
      {
        $group: {
          _id: '$menuId',
          itemName: { $first: '$menuDetails.name' },
          price: { $first: '$menuDetails.price' },
          totalQuantity: { $sum: '$quantity' },
          timesOrdered: { $sum: 1 },
          revenue: { $sum: { $multiply: ['$quantity', '$price'] } }
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    res.status(200).json({
      success: true,
      data: mostOrdered
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch most ordered items', 
      error: error.message 
    });
  }
};

// Analytics: Daily Sales Summary
exports.getDailySalesSummary = async (req, res) => {
  try {
    const dailySales = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'ready'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          totalSales: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: dailySales
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch daily sales summary', 
      error: error.message 
    });
  }
};

// Analytics: Revenue per Menu Item
exports.getRevenuePerMenuItem = async (req, res) => {
  try {
    const revenuePerItem = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId',
          foreignField: '_id',
          as: 'orderDetails'
        }
      },
      {
        $unwind: '$orderDetails'
      },
      {
        $match: {
          'orderDetails.status': { $in: ['completed', 'ready'] }
        }
      },
      {
        $lookup: {
          from: 'menuitems',
          localField: 'menuId',
          foreignField: '_id',
          as: 'menuDetails'
        }
      },
      {
        $unwind: '$menuDetails'
      },
      {
        $group: {
          _id: '$menuId',
          itemName: { $first: '$menuDetails.name' },
          category: { $first: '$menuDetails.category' },
          unitPrice: { $first: '$price' },
          unitsSold: { $sum: '$quantity' },
          totalRevenue: { $sum: { $multiply: ['$quantity', '$price'] } }
        }
      },
      {
        $sort: { totalRevenue: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: revenuePerItem
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch revenue per item', 
      error: error.message 
    });
  }
};

// Analytics: Average Order Value
exports.getAverageOrderValue = async (req, res) => {
  try {
    const averageOrderValue = await Order.aggregate([
      {
        $match: {
          status: { $in: ['completed', 'ready'] }
        }
      },
      {
        $group: {
          _id: null,
          averageValue: { $avg: '$totalAmount' },
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          minOrderValue: { $min: '$totalAmount' },
          maxOrderValue: { $max: '$totalAmount' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: averageOrderValue[0] || {}
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch average order value', 
      error: error.message 
    });
  }
};

// Analytics: Order Status Distribution
exports.getOrderStatusDistribution = async (req, res) => {
  try {
    const statusDistribution = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: statusDistribution
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch order status distribution', 
      error: error.message 
    });
  }
};

// Analytics: Category-wise Sales
exports.getCategoryWiseSales = async (req, res) => {
  try {
    const categoryWiseSales = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'menuitems',
          localField: 'menuId',
          foreignField: '_id',
          as: 'menuDetails'
        }
      },
      {
        $unwind: '$menuDetails'
      },
      {
        $group: {
          _id: '$menuDetails.category',
          totalSales: { $sum: { $multiply: ['$quantity', '$price'] } },
          itemsOrdered: { $sum: '$quantity' },
          uniqueItems: { $addToSet: '$menuId' }
        }
      },
      {
        $project: {
          _id: 1,
          totalSales: 1,
          itemsOrdered: 1,
          uniqueItemsCount: { $size: '$uniqueItems' }
        }
      },
      {
        $sort: { totalSales: -1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: categoryWiseSales
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch category wise sales', 
      error: error.message 
    });
  }
};
