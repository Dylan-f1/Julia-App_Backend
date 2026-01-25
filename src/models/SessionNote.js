const mongoose = require('mongoose');

const sessionNoteSchema = new mongoose.Schema(
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
    sessionDate: {
      type: Date,
      required: true,
    },
    
    // Fichier uploadé sur S3
    fileUrl: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    
    // Texte extrait par OCR
    extractedText: {
      type: String,
    },
    
    // Synthèse générée par l'IA
    aiSummary: {
      type: String,
    },
    
    isProcessed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SessionNote', sessionNoteSchema);