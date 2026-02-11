const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validation');
const { protectProfessional, protectPatient } = require('../middlewares/auth');
const {
  startConversation,
  sendMessage,
  getActiveConversation,
  getConversation,
  getAllConversations,
  closeConversation,
  getConversationForPatient,
  getConversationHistory,
} = require('../controllers/conversationController');

// ========== PATIENT ROUTES ==========

// Démarrer une nouvelle conversation
router.post(
  '/',
  protectPatient,
  [body('firstMessage').trim().notEmpty(), validate],
  startConversation
);

// Envoyer un message dans une conversation
router.post(
  '/:id/messages',
  protectPatient,
  [body('message').trim().notEmpty(), validate],
  sendMessage
);

// Fermer une conversation
router.post(
  '/:id/close',
  protectPatient,
  [body('gravityLevel').isInt({ min: 1, max: 3 }), validate],
  closeConversation
);

router.get('/active', protectPatient, getActiveConversation);

router.get('/history', protectPatient, getConversationHistory);

router.get('/patient/:id', protectPatient, getConversationForPatient);

// ========== PROFESSIONAL ROUTES ==========
router.get('/professional', protectProfessional, getAllConversations);

router.get('/:id', protectProfessional, getConversation);

module.exports = router;