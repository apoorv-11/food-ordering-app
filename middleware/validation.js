const Joi = require('joi');

// MongoDB ObjectId validation
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const schemas = {
  register: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().trim().required(),
    role: Joi.string().valid('student', 'admin').default('student')
  }).strict(),

  login: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required()
  }).strict(),

  createMenuItem: Joi.object({
    name: Joi.string().trim().min(3).required(),
    description: Joi.string().trim().optional(),
    price: Joi.number().positive().required(),
    category: Joi.string()
      .valid('Main Course', 'Snacks', 'Beverages', 'Desserts', 'Breakfast')
      .required(),
    image: Joi.string().uri().optional(),
    available: Joi.boolean().default(true)
  }).strict(),

  updateMenuItem: Joi.object({
    name: Joi.string().trim().min(3).optional(),
    description: Joi.string().trim().optional(),
    price: Joi.number().positive().optional(),
    category: Joi.string()
      .valid('Main Course', 'Snacks', 'Beverages', 'Desserts', 'Breakfast')
      .optional(),
    image: Joi.string().uri().optional(),
    available: Joi.boolean().optional()
  }).strict(),

  createOrder: Joi.object({
  items: Joi.array().items(
    Joi.object({
      menuId: Joi.string().pattern(objectIdPattern).required(),
      quantity: Joi.number().integer().positive().required()
    })
  ).min(1).required(),

  // Accept strict ISO 8601 UTC only (e.g., 2025-11-17T10:30:00Z)
  pickupTime: Joi.string()
  .pattern(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?Z$/
  )
  .required()
  .messages({
    "string.pattern.base": "pickupTime must be ISO 8601 UTC, e.g. 2025-11-17T10:30:00Z"
  }),



  specialInstr: Joi.string().trim().max(500).optional()
}).strict(),

updateOrder: Joi.object({
  items: Joi.array().items(
    Joi.object({
      menuId: Joi.string().pattern(objectIdPattern).required(),
      quantity: Joi.number().integer().positive().required()
    })
  ).min(1).optional(),

  // Accept strict ISO 8601 UTC only (e.g., 2025-11-17T10:30:00Z)
  pickupTime: Joi.string()
  .pattern(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?Z$/
  )
  .required()
  .messages({
    "string.pattern.base": "pickupTime must be ISO 8601 UTC, e.g. 2025-11-17T10:30:00Z"
  }),

  specialInstr: Joi.string().trim().max(500).optional()
}).strict()
};

// Generic validation middleware
const validate = (schemaKey) => {
  return (req, res, next) => {
    const schema = schemas[schemaKey];
    if (!schema) {
      return res.status(500).json({
        success: false,
        message: 'Validation schema not found'
      });
    }

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true // remove unexpected fields safely
    });

    if (error) {
      return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(d => d.message)
      });
    }

    req.validated = value;
    next();
  };
};

module.exports = { validate, schemas };
