// validators/activityValidator.js
// Validation schemas for Activity API endpoints
// Using Joi for input validation

const Joi = require('joi');

// Schema for creating a new activity (optional helper endpoint)
// - action: required string, max 100 chars
// - details: optional mixed object
const createActivitySchema = Joi.object({
  action: Joi.string().required().trim().max(100),
  details: Joi.object().optional(),
});

// Schema for query params on GET activities
const getActivitiesQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { createActivitySchema, getActivitiesQuerySchema };