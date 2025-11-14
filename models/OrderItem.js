const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  orderItemId: { 
    type: String, 
    default: () => new mongoose.Types.ObjectId().toString(), 
    unique: true 
  },
  orderId: { 
    type: String, 
    ref: 'Order',
    required: true
  },
  menuId: { 
    type: String, 
    ref: 'MenuItem',
    required: true
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  }
});

module.exports = mongoose.model('OrderItem', orderItemSchema);