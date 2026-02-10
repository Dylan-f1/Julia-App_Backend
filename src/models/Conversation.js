const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    messages: [
      {
        sender: {
          type: String,
          enum: ['patient', 'ai', 'professional'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        color: {
          type: String,
          enum: ['blue', 'green', 'purple'], // patient, ai, professional
        },
      },
    ],
    // Auto-évaluation post-discussion
    evaluation: {
      gravityLevel: {
        type: Number,
        min: 1,
        max: 3,
      },
      timestamp: Date,
      rationality: Boolean,
    },
    // Synthèse générée par l'IA
    summary: {
      keywords: [String],
      mainConcern: String,
      urgencyDetected: {
        type: Boolean,
        default: false,
      },
      generatedAt: Date,
    },
    status: {
      type: String,
      enum: ['active', 'closed'],
      default: 'active',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    closedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index pour améliorer les performances
conversationSchema.index({ patientId: 1, status: 1 });
conversationSchema.index({ professionalId: 1, 'summary.urgencyDetected': 1 });

module.exports = mongoose.model('Conversation', conversationSchema);