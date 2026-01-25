const express = require('express');
const router = express.Router();
const { protectProfessional } = require('../middlewares/auth');
const {
  getProfile,
  updateProfile,
  getDashboardStats,
  updateCalendar,
} = require('../controllers/professionalController');

router.use(protectProfessional);

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.get('/dashboard', getDashboardStats);
router.put('/calendar', updateCalendar);

module.exports = router;