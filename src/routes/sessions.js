const express = require('express');
const router = express.Router();
const { protectProfessional } = require('../middlewares/auth');
const {
  uploadSessionNote,
  uploadMiddleware,
  processSessionNote,
  getSessionNotes,
  getSessionNote,
  deleteSessionNote,
} = require('../controllers/sessionController');

router.use(protectProfessional);

router.post('/', uploadMiddleware, uploadSessionNote);
router.post('/:id/process', processSessionNote);
router.get('/patient/:patientId', getSessionNotes);
router.get('/:id', getSessionNote);
router.delete('/:id', deleteSessionNote);

module.exports = router;