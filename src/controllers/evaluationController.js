const DailyEvaluation = require('../models/DailyEvaluation');
const Patient = require('../models/Patient');

// @desc    Create daily evaluation
// @route   POST /api/evaluations
exports.createEvaluation = async (req, res) => {
  try {
    const { mood, anxiety, sleep, note } = req.body;
    const patientId = req.patient._id;

    // Créer ou mettre à jour l'évaluation du jour
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let evaluation = await DailyEvaluation.findOne({
      patientId,
      date: today,
    });

    if (evaluation) {
      evaluation.mood = mood;
      if (anxiety !== undefined) evaluation.anxiety = anxiety;
      if (sleep !== undefined) evaluation.sleep = sleep;
      if (note !== undefined) evaluation.note = note;
      await evaluation.save();
    } else {
      const evalData = { patientId, mood, date: today };
      if (anxiety !== undefined) evalData.anxiety = anxiety;
      if (sleep !== undefined) evalData.sleep = sleep;
      if (note !== undefined) evalData.note = note;
      evaluation = await DailyEvaluation.create(evalData);
    }

    res.status(201).json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création de l\'évaluation' });
  }
};

// @desc    Get evaluations for patient
// @route   GET /api/evaluations
exports.getEvaluations = async (req, res) => {
  try {
    const patientId = req.patient._id;
    const { startDate, endDate, limit = 30 } = req.query;

    const filter = { patientId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const evaluations = await DailyEvaluation.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: evaluations.length,
      evaluations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Get evaluations for a patient (professional)
// @route   GET /api/evaluations/patient/:patientId
exports.getPatientEvaluations = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;

    // Vérifier que le patient appartient au professionnel
    const patient = await Patient.findById(patientId);
    if (!patient || patient.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const filter = { patientId };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const evaluations = await DailyEvaluation.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    // Calculer statistiques
    const stats = {
      average: 0,
      trend: 'stable',
      total: evaluations.length,
    };

    if (evaluations.length > 0) {
      const sum = evaluations.reduce((acc, curr) => acc + curr.mood, 0);
      stats.average = (sum / evaluations.length).toFixed(1);

      // Calculer la tendance (7 derniers jours vs 7 jours précédents)
      if (evaluations.length >= 14) {
        const recent = evaluations.slice(0, 7);
        const previous = evaluations.slice(7, 14);

        const recentAvg = recent.reduce((acc, curr) => acc + curr.mood, 0) / 7;
        const previousAvg = previous.reduce((acc, curr) => acc + curr.mood, 0) / 7;

        if (recentAvg > previousAvg + 0.5) stats.trend = 'improving';
        else if (recentAvg < previousAvg - 0.5) stats.trend = 'declining';
      }
    }

    res.json({
      success: true,
      count: evaluations.length,
      evaluations,
      stats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Get today's evaluation
// @route   GET /api/evaluations/today
exports.getTodayEvaluation = async (req, res) => {
  try {
    const patientId = req.patient._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const evaluation = await DailyEvaluation.findOne({
      patientId,
      date: today,
    });

    res.json({
      success: true,
      evaluation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};