const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) {
    const message = error.details.map(d => d.message).join(', ');
    return res.status(400).json({ message });
  }
  next();
};

const createDepartmentSchema = Joi.object({
  name: Joi.string().trim().required(),
  code: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  headOfDepartment: Joi.string().allow('', null),
  status: Joi.string().allow('', null)
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string().trim().allow('', null),
  code: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  headOfDepartment: Joi.string().allow('', null),
  status: Joi.string().allow('', null)
});

exports.validateCreateDepartment = validate(createDepartmentSchema);
exports.validateUpdateDepartment = validate(updateDepartmentSchema);
