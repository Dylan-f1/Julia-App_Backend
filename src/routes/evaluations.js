const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middlewares/validation');
const { protectProfessional, protectPatient } = require('../middlewares/auth');
const {
  createEvaluation,
  getEvaluations,
  getPatientEvaluations,
  getTodayEvaluation,
} = require('../controllers/evaluationController');

// Patient routes
router.post(
  '/',
  protectPatient,
  [
    body('mood').isInt({ min: 1, max: 5 }),
    body('anxiety').optional().isInt({ min: 1, max: 5 }),
    body('sleep').optional().isInt({ min: 1, max: 5 }),
    validate,
  ],
  createEvaluation
);

router.get('/', protectPatient, getEvaluations);
router.get('/today', protectPatient, getTodayEvaluation);

// Professional routes
router.get('/patient/:patientId', protectProfessional, getPatientEvaluations);

module.exports = router;