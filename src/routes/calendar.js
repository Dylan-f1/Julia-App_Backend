const express = require('express');
const router = express.Router();
const { protectProfessional } = require('../middlewares/auth');
const {
  getAvailability,
  bookAppointment,
} = require('../controllers/calendarController');

router.use(protectProfessional);

router.get('/availability', getAvailability);
router.post('/book', bookAppointment);

module.exports = router;