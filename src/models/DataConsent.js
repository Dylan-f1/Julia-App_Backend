// models/DataConsent.js
const mongoose = require('mongoose');

const dataConsentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  consentGiven: {
    type: Boolean,
    required: true
  },
  consentDate: {
    type: Date,
    required: true
  },
  ipAddress: String,
  version: {
    type: String,
    default: '1.0'
  },
  withdrawnDate: Date,
  withdrawnReason: String
}, {
  timestamps: true
});

module.exports = mongoose.model('DataConsent', dataConsentSchema);