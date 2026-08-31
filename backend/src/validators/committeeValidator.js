const Joi = require('joi');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) {
    const message = error.details.map(d => d.message).join(', ');
    return res.status(400).json({ message });
  }
  next();
};

const dateOrString = Joi.alternatives().try(Joi.date(), Joi.string().allow('', null));

const createCommitteeSchema = Joi.object({
  committeeNumber: Joi.string().trim().required(),
  member1: Joi.string().trim().required(),
  member2: Joi.string().trim().required(),
  member3: Joi.string().trim().required(),
  additionalMembers: Joi.array().items(Joi.string().allow('', null)).optional(),
  appointedDate: dateOrString.required(),
  status: Joi.string().allow('', null)
});

const updateCommitteeSchema = Joi.object({
  committeeNumber: Joi.string().trim().allow('', null),
  member1: Joi.string().trim().allow('', null),
  member2: Joi.string().trim().allow('', null),
  member3: Joi.string().trim().allow('', null),
  additionalMembers: Joi.array().items(Joi.string().allow('', null)).optional(),
  appointedDate: dateOrString,
  status: Joi.string().allow('', null)
});

exports.validateCreateCommittee = validate(createCommitteeSchema);
exports.validateUpdateCommittee = validate(updateCommitteeSchema);
