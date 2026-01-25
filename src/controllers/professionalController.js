const User = require('../models/User');
const Patient = require('../models/Patient');
const Conversation = require('../models/Conversation');

// @desc    Get professional profile
// @route   GET /api/professionals/me
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Update professional profile
// @route   PUT /api/professionals/me
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName',
      'lastName',
      'profession',
      'workLocation',
      'consultationType',
      'phone',
      'calendarIntegration',
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};

// @desc    Get dashboard stats
// @route   GET /api/professionals/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const professionalId = req.user._id;

    // Total patients
    const totalPatients = await Patient.countDocuments({
      professionalId,
      isActive: true,
    });

    // Conversations actives
    const activeConversations = await Conversation.countDocuments({
      professionalId,
      status: 'active',
    });

    // Conversations urgentes (gravité élevée)
    const urgentConversations = await Conversation.countDocuments({
      professionalId,
      status: 'closed',
      'evaluation.gravityLevel': 3,
      closedAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Dernières 24h
      },
    });

    // Patients sans RDV
    const patientsWithoutAppointment = await Patient.countDocuments({
      professionalId,
      isActive: true,
      $or: [
        { nextSessionDate: null },
        { nextSessionDate: { $lt: new Date() } },
      ],
    });

    // Activité récente (7 derniers jours)
    const recentActivity = await Conversation.aggregate([
      {
        $match: {
          professionalId: req.user._id,
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json({
      success: true,
      stats: {
        totalPatients,
        activeConversations,
        urgentConversations,
        patientsWithoutAppointment,
        recentActivity,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Update calendar integration
// @route   PUT /api/professionals/calendar
exports.updateCalendar = async (req, res) => {
  try {
    const { type, calendarUrl, apiKey } = req.body;

    const user = await User.findById(req.user._id);

    user.calendarIntegration = {
      type,
      calendarUrl,
      apiKey, // À encrypter en production
    };

    await user.save();

    res.json({
      success: true,
      message: 'Calendrier mis à jour',
      calendarIntegration: user.calendarIntegration,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
};