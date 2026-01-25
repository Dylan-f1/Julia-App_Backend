const mongoose = require('mongoose');
const crypto = require('crypto');

const patientSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    magicLinkToken: {
      type: String,
    },
    magicLinkExpiry: {
      type: Date,
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Infos personnelles
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    birthDate: {
      type: Date,
    },
    profession: {
      type: String,
      trim: true,
    },
    familySituation: {
      type: String,
      trim: true,
    },
    therapySubject: {
      type: String,
      trim: true,
    },
    
    // Suivi
    sessionCount: {
      type: Number,
      default: 0,
    },
    lastSessionDate: {
      type: Date,
    },
    nextSessionDate: {
      type: Date,
    },
    currentScore: {
      type: Number,
      min: 0,
      max: 10,
      default: 5,
    },
    
    // Paramètres personnalisés par le psy
    recommendedActions: [
      {
        type: {
          type: String,
          enum: ['breathing', 'writing', 'walk', 'music', 'call', 'other'],
        },
        title: String,
        description: String,
        link: String,
      },
    ],
    
    gravityThresholds: {
      low: {
        type: Number,
        default: 3,
      },
      medium: {
        type: Number,
        default: 6,
      },
      high: {
        type: Number,
        default: 9,
      },
    },
    
    // RGPD
    rgpdConsent: {
      type: Boolean,
      default: false,
    },
    rgpdConsentDate: {
      type: Date,
    },
    
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

patientSchema.methods.generateMagicLink = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.magicLinkToken = crypto.createHash('sha256').update(token).digest('hex');
  this.magicLinkExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24h
  
  return token;
};

module.exports = mongoose.model('Patient', patientSchema);