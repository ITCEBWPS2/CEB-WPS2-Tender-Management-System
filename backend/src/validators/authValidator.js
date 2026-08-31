const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) {
    const message = error.details.map(d => d.message).join(', ');
    return res.status(400).json({ message });
  }
  next();
};

const registerSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().trim().required(),
  epfNumber: Joi.string().trim().required(),
  password: Joi.string().required(),
  role: Joi.string().trim().allow('', null)
});

const loginSchema = Joi.object({
  email: Joi.string().trim().required(),
  password: Joi.string().required()
});

exports.validateRegister = validate(registerSchema);
exports.validateLogin = validate(loginSchema);
