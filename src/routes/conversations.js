const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validation');
const { protectProfessional, protectPatient } = require('../middlewares/auth');
const {
  startConversation,
  sendMessage,
  closeConversation,
  getActiveConversation,
  getConversationHistory,
  getConversationsForProfessional,
  getConversation,
} = require('../controllers/conversationController');

// Patient routes
router.post(
  '/',
  protectPatient,
  [body('firstMessage').trim().notEmpty(), validate],
  startConversation
);

router.post(
  '/:id/messages',
  protectPatient,
  [body('message').trim().notEmpty(), validate],
  sendMessage
);

router.post(
  '/:id/close',
  protectPatient,
  [
    body('gravityLevel').isInt({ min: 1, max: 3 }),
    validate,
  ],
  closeConversation
);

router.get('/active', protectPatient, getActiveConversation);
router.get('/history', protectPatient, getConversationHistory);

// Professional routes
router.get('/professional', protectProfessional, getConversationsForProfessional);
router.get('/:id', protectProfessional, getConversation);

module.exports = router;