const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validation');
const { protectProfessional, protectPatient } = require('../middlewares/auth');
const {
  registerProfessional,
  loginProfessional,
  sendMagicLink,
  verifyMagicLink,
  getMe,
} = require('../controllers/authController');

// Register professional
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('profession').notEmpty(),
    body('workLocation').notEmpty(),
    validate,
  ],
  registerProfessional
);

// Login professional
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
    validate,
  ],
  loginProfessional
);

// Send magic link to patient
router.post('/magic-link', protectProfessional, sendMagicLink);

// Verify magic link
router.post(
  '/verify-magic-link',
  [body('token').notEmpty(), validate],
  verifyMagicLink
);

// Get current user (works for both professional and patient)
router.get('/me', (req, res, next) => {
  // Essayer les deux middlewares
  if (req.headers.authorization) {
    const token = req.headers.authorization.split(' ')[1];
    // Simple detection (à améliorer)
    protectProfessional(req, res, (err) => {
      if (err || !req.user) {
        protectPatient(req, res, next);
      } else {
        next();
      }
    });
  } else {
    res.status(401).json({ message: 'Non autorisé' });
  }
}, getMe);

module.exports = router;