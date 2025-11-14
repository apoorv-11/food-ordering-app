const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  menuId: { 
    type: String, 
    default: () => new mongoose.Types.ObjectId().toString(), 
    unique: true 
  },
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  price: { 
    type: Number, 
    required: true,
    min: 0
  },
  category: { 
    type: String, 
    required: true,
    enum: ['Main Course', 'Snacks', 'Beverages', 'Desserts', 'Breakfast']
  },
  image: { 
    type: String 
  },
  available: { 
    type: Boolean, 
    default: true 
  },
  rating: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 5
  },
  createdBy: { 
    type: String, 
    ref: 'User',
    required: true
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);