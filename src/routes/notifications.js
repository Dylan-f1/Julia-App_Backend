const express = require('express');
const router = express.Router();
const { protectProfessional } = require('../middlewares/auth');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  registerPushToken,
} = require('../controllers/notificationController');

router.use(protectProfessional);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.post('/register-token', registerPushToken);

module.exports = router;