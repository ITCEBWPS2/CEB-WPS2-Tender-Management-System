const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) {
    const message = error.details.map(d => d.message).join(', ');
    return res.status(400).json({ message });
  }
  next();
};

const createStaffSchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().allow('', null),
  area: Joi.string().allow('', null),
  designation: Joi.string().allow('', null),
  department: Joi.string().allow('', null)
});

const updateStaffSchema = Joi.object({
  name: Joi.string().trim().allow('', null),
  email: Joi.string().allow('', null),
  area: Joi.string().allow('', null),
  designation: Joi.string().allow('', null),
  department: Joi.string().allow('', null)
});

exports.validateCreateStaff = validate(createStaffSchema);
exports.validateUpdateStaff = validate(updateStaffSchema);
