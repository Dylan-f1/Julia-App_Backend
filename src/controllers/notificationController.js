const Notification = require('../models/Notification');

// @desc    Get notifications for professional
// @route   GET /api/notifications
exports.getNotifications = async (req, res) => {
  try {
    const professionalId = req.user._id;
    const { read, priority, limit = 50 } = req.query;

    const filter = { professionalId };
    if (read !== undefined) filter.read = read === 'true';
    if (priority) filter.priority = priority;

    const notifications = await Notification.find(filter)
      .populate('patientId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({
      professionalId,
      read: false,
    });

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    // Vérifier autorisation
    if (notification.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res) => {
  try {
    const professionalId = req.user._id;

    await Notification.updateMany(
      { professionalId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'Toutes les notifications marquées comme lues',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification non trouvée' });
    }

    // Vérifier autorisation
    if (notification.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await notification.remove();

    res.json({
      success: true,
      message: 'Notification supprimée',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Register push token
// @route   POST /api/notifications/register-token
exports.registerPushToken = async (req, res) => {
  try {
    const { expoPushToken } = req.body;
    const professionalId = req.user._id;

    // Stocker le token (vous pouvez le stocker dans le modèle User)
    // Pour l'instant on le retourne juste
    
    res.json({
      success: true,
      message: 'Token enregistré',
      token: expoPushToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};