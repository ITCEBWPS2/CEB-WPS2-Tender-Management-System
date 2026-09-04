const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) {
    const message = error.details.map(d => d.message).join(', ');
    return res.status(400).json({ message });
  }
  next();
};

const epfRegex = /^\d{5}$/;

const createUserSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email({ tlds: false }).trim().required(),
  epfNumber: Joi.string().trim().pattern(epfRegex).messages({
    'string.pattern.base': 'EPF Number must be exactly 5 numeric digits'
  }).required(),
  password: Joi.string().required(),
  role: Joi.string().allow('', null),
  status: Joi.string().allow('', null)
});

const updateUserSchema = Joi.object({
  name: Joi.string().trim().allow('', null),
  email: Joi.string().email({ tlds: false }).trim().allow('', null),
  epfNumber: Joi.string().trim().pattern(epfRegex).messages({
    'string.pattern.base': 'EPF Number must be exactly 5 numeric digits'
  }).allow('', null),
  password: Joi.string().allow('', null),
  role: Joi.string().allow('', null),
  status: Joi.string().allow('', null)
});

exports.validateCreateUser = validate(createUserSchema);
exports.validateUpdateUser = validate(updateUserSchema);
