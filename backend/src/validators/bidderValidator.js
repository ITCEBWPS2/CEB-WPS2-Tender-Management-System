const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) {
    const message = error.details.map(d => d.message).join(', ');
    return res.status(400).json({ message });
  }
  next();
};

const sriLankanContactRegex = /^\+94\d{9}$/;

const createBidderSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  contact: Joi.string().pattern(sriLankanContactRegex).messages({
    'string.pattern.base': 'Contact number must be in Sri Lankan +94 format (e.g. +94771234567)'
  }).allow('', null)
});

const updateBidderSchema = Joi.object({
  name: Joi.string().trim().allow('', null),
  email: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  contact: Joi.string().pattern(sriLankanContactRegex).messages({
    'string.pattern.base': 'Contact number must be in Sri Lankan +94 format (e.g. +94771234567)'
  }).allow('', null)
});

exports.validateCreateBidder = validate(createBidderSchema);
exports.validateUpdateBidder = validate(updateBidderSchema);
