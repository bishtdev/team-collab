// validators/projectValidator.js
const Joi = require('joi');

const createProjectSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  assignedUsers: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).optional()
});

module.exports = { createProjectSchema };
