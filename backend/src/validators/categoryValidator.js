const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) {
    const message = error.details.map(d => d.message).join(', ');
    return res.status(400).json({ message });
  }
  next();
};

const createCategorySchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().allow('', null),
  status: Joi.string().allow('', null)
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().allow('', null),
  description: Joi.string().allow('', null),
  status: Joi.string().allow('', null)
});

exports.validateCreateCategory = validate(createCategorySchema);
exports.validateUpdateCategory = validate(updateCategorySchema);
