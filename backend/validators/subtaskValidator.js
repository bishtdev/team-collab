const Joi = require('joi');

const createSubtaskSchema = Joi.object({
  title: Joi.string().required().trim().min(1).max(500),
  assigneeId: Joi.string().length(24).hex().optional(),
});

const updateSubtaskSchema = Joi.object({
  title: Joi.string().trim().min(1).max(500).optional(),
  completed: Joi.boolean().optional(),
  assigneeId: Joi.string().length(24).hex().allow(null).optional(),
});

module.exports = { createSubtaskSchema, updateSubtaskSchema };
