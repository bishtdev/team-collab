// validators/taskValidator.js
const Joi = require('joi');

// Schema for creating a new task
// All required fields must be present
const createTaskSchema = Joi.object({
  title: Joi.string().required().max(200),
  description: Joi.string().allow('', null).max(2000),
  status: Joi.string().valid('todo', 'in-progress', 'done').default('todo'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  dueDate: Joi.date().allow(null).optional(),
  projectId: Joi.string().required(),
  assignedTo: Joi.string().optional().allow(null, ''),
});

// Schema for updating an existing task
// All fields are optional - only provided fields will be updated
const updateTaskSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  description: Joi.string().allow('', null).max(2000).optional(),
  status: Joi.string().valid('todo', 'in-progress', 'done').optional(),
  assignedTo: Joi.string().optional().allow(null, ''),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
  dueDate: Joi.date().allow(null).optional(),
}).min(1); // At least one field must be provided for update

module.exports = { createTaskSchema, updateTaskSchema };
