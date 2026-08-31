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

const createRecordSchema = Joi.object({
  tenderNumber: Joi.string().trim().required(),
  relevantTo: Joi.string().allow('', null),
  category: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  other: Joi.string().allow('', null),
  bidStartDate: dateOrString,
  bidOpenDate: dateOrString,
  bidClosingDate: dateOrString,
  approvedDate: dateOrString,
  fileSentToTecDate: dateOrString,
  fileSentToTecSecondTime: dateOrString,
  bidBondNumber: Joi.string().allow('', null),
  bidBondBank: Joi.string().allow('', null),
  bidValidityPeriod: dateOrString,
  remark: Joi.string().allow('', null),
  status: Joi.string().allow('', null),
  tecCommitteeNumber: Joi.string().allow('', null),
  tecChairman: Joi.string().allow('', null),
  tecMember1: Joi.string().allow('', null),
  tecMember2: Joi.string().allow('', null),
  awardedTo: Joi.string().allow('', null),
  serviceAgreementStartDate: dateOrString,
  serviceAgreementEndDate: dateOrString,
  performanceBondNumber: Joi.string().allow('', null),
  performanceBondBank: Joi.string().allow('', null),
  performanceBondRemark: Joi.string().allow('', null),
  delay: Joi.number().allow(null)
});

const updateRecordSchema = Joi.object({
  tenderNumber: Joi.string().trim().allow('', null),
  relevantTo: Joi.string().allow('', null),
  category: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  other: Joi.string().allow('', null),
  bidStartDate: dateOrString,
  bidOpenDate: dateOrString,
  bidClosingDate: dateOrString,
  approvedDate: dateOrString,
  fileSentToTecDate: dateOrString,
  fileSentToTecSecondTime: dateOrString,
  bidBondNumber: Joi.string().allow('', null),
  bidBondBank: Joi.string().allow('', null),
  bidValidityPeriod: dateOrString,
  remark: Joi.string().allow('', null),
  status: Joi.string().allow('', null),
  tecCommitteeNumber: Joi.string().allow('', null),
  tecChairman: Joi.string().allow('', null),
  tecMember1: Joi.string().allow('', null),
  tecMember2: Joi.string().allow('', null),
  awardedTo: Joi.string().allow('', null),
  serviceAgreementStartDate: dateOrString,
  serviceAgreementEndDate: dateOrString,
  performanceBondNumber: Joi.string().allow('', null),
  performanceBondBank: Joi.string().allow('', null),
  performanceBondRemark: Joi.string().allow('', null),
  delay: Joi.number().allow(null)
});

exports.validateCreateRecord = validate(createRecordSchema);
exports.validateUpdateRecord = validate(updateRecordSchema);
