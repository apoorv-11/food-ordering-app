const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { 
    type: String, 
    default: () => new mongoose.Types.ObjectId().toString(), 
    unique: true 
  },
  userId: { 
    type: String, 
    ref: 'User',
    required: true
  },
  totalAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  status: { 
    type: String, 
    enum: ['placed', 'preparing', 'ready', 'completed', 'canceled'],
    default: 'placed'
  },
  pickupTime: { 
    type: Date,
    required: true
  },
  specialInstr: { 
    type: String,
    trim: true,
    maxlength: 500
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date,
    default: Date.now
  },
  startedAt: { 
    type: Date 
  },
  completedAt: { 
    type: Date 
  }
});

// Update updatedAt on any modification
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Order', orderSchema);