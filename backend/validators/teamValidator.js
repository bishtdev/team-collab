const Joi = require('joi');

const createTeamSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
});

module.exports = { createTeamSchema };
