// validators/commentValidator.js
// Validation schemas for Comment API endpoints
// Using Joi for input validation (consistent with existing validators)

const Joi = require('joi');

// Schema for creating a new comment
// - content: required string, trimmed, max 2000 chars
const createCommentSchema = Joi.object({
  content: Joi.string().required().trim().min(1).max(2000),
});

// Schema for query params on GET comments
const getCommentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { createCommentSchema, getCommentsQuerySchema };