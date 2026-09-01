const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedByName: { type: String },
  uploadedByEmail: { type: String },
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

const recordSchema = new mongoose.Schema({
  tenderNumber: { type: String, required: true, unique: true },
  relevantTo: { type: String },
  category: { type: String },
  description: { type: String },
  other: { type: String },
  bidStartDate: { type: Date },
  bidOpenDate: { type: Date },
  bidClosingDate: { type: Date },
  approvedDate: { type: Date },
  fileSentToTecDate: { type: Date },
  fileSentToTecSecondTime: { type: Date },
  bidBondNumber: { type: String },
  bidBondBank: { type: String },
  bidValidityPeriod: { type: Date },
  remark: { type: String },
  status: { type: String },
  tecCommitteeNumber: { type: String },
  tecChairman: { type: String },
  tecMember1: { type: String },
  tecMember2: { type: String },
  awardedTo: { type: String },
  serviceAgreementStartDate: { type: Date },
  serviceAgreementEndDate: { type: Date },
  performanceBondNumber: { type: String },
  performanceBondBank: { type: String },
  performanceBondRemark: { type: String },
  delay: { type: Number },
  documents: [documentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Record', recordSchema);
