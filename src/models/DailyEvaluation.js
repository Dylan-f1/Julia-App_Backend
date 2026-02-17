const mongoose = require('mongoose');

const dailyEvaluationSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: () => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      },
    },
    mood: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    anxiety: {
      type: Number,
      min: 1,
      max: 5,
    },
    sleep: {
      type: Number,
      min: 1,
      max: 5,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Un seul mood par jour par patient
dailyEvaluationSchema.index({ patientId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyEvaluation', dailyEvaluationSchema);