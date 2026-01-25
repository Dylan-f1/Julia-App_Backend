const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validation');
const { protectProfessional, protectPatient } = require('../middlewares/auth');
const {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient,
  resendMagicLink,
  getMyProfile,
  updateRGPDConsent,
} = require('../controllers/patientController');

// Routes for patients (self)
router.get('/me', protectPatient, getMyProfile);
router.put('/me/rgpd', protectPatient, updateRGPDConsent);

// Routes for professionals
router.post(
  '/',
  protectProfessional,
  [
    body('email').isEmail().normalizeEmail(),
    body('firstName').optional().trim(),
    body('lastName').optional().trim(),
    validate,
  ],
  createPatient
);

router.get('/', protectProfessional, getPatients);
router.get('/:id', protectProfessional, getPatient);
router.put('/:id', protectProfessional, updatePatient);
router.delete('/:id', protectProfessional, deletePatient);
router.post('/:id/resend-magic-link', protectProfessional, resendMagicLink);

module.exports = router;