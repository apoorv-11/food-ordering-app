const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT and attach user info to request
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Middleware: Check if user is authenticated
const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided. Please login.' 
      });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token.' 
      });
    }

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Auth error', error: error.message });
  }
};

// Middleware: Check if user is admin
const adminMiddleware = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin role required.' 
    });
  }
  next();
};

// Middleware: Check if user is student
const studentMiddleware = (req, res, next) => {
  if (req.userRole !== 'student') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Student role required.' 
    });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, studentMiddleware, verifyToken };
