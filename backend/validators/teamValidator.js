const Joi = require('joi');

const createTeamSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow('', null),
  // Every team must belong to a workspace (isolation boundary).
  orgId: Joi.string().hex().length(24).required(),
});

module.exports = { createTeamSchema };
