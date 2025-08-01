const Joi = require('joi');

const createProjectSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
});

module.exports = { createProjectSchema };
