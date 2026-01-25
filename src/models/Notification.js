const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
    },
    
    type: {
      type: String,
      enum: [
        'conversation_started',
        'high_gravity',
        'no_appointment',
        'follow_up_needed',
        'new_patient',
      ],
      required: true,
    },
    
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    
    // Lien vers la ressource concernée
    relatedConversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
    },
    
    // Pour les push notifications
    expoPushToken: {
      type: String,
    },
    sent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index
notificationSchema.index({ professionalId: 1, read: 1 });
notificationSchema.index({ professionalId: 1, priority: 1 });

module.exports = mongoose.model('Notification', notificationSchema);