const Joi = require('joi');

const createTaskSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('todo', 'in-progress', 'done').default('todo'),
  projectId: Joi.string().required(),
  assignedTo: Joi.string().optional().allow(null, ''),
});

module.exports = { createTaskSchema };
