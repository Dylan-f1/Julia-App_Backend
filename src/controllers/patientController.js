const Patient = require('../models/Patient');
const User = require('../models/User');
const emailService = require('../services/emailService');
const QRCode = require('qrcode');

// @desc    Create patient
// @route   POST /api/patients
exports.createPatient = async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      birthDate,
      profession,
      familySituation,
      therapySubject,
      recommendedActions,
      gravityThresholds,
    } = req.body;

    const professionalId = req.user._id;

    // Vérifier si le patient existe déjà pour ce professionnel
    const existingPatient = await Patient.findOne({
      email,
      professionalId,
    });

    if (existingPatient) {
      return res.status(400).json({ message: 'Ce patient existe déjà' });
    }

    // Créer le patient
    const patient = await Patient.create({
      email,
      firstName,
      lastName,
      birthDate,
      profession,
      familySituation,
      therapySubject,
      professionalId,
      recommendedActions: recommendedActions || [
        {
          type: 'breathing',
          title: 'Exercice de respiration',
          description: 'Prenez 5 minutes pour respirer profondément',
        },
        {
          type: 'walk',
          title: 'Marche de 10 minutes',
          description: 'Sortez prendre l\'air et marcher',
        },
        {
          type: 'call',
          title: 'Appeler un proche',
          description: 'Contactez une personne de confiance',
        },
      ],
      gravityThresholds: gravityThresholds || {
        low: 3,
        medium: 6,
        high: 9,
      },
    });

    // Générer le magic link
    const token = patient.generateMagicLink();
    await patient.save();

    // Générer QR code
    const magicLink = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
    const qrCodeDataUrl = await QRCode.toDataURL(magicLink);

    // Envoyer l'email au patient
    await emailService.sendMagicLink(
      email,
      token,
      `${firstName} ${lastName}`
    );

    res.status(201).json({
      success: true,
      patient,
      magicLink,
      qrCode: qrCodeDataUrl,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la création du patient' });
  }
};

// @desc    Get all patients for professional
// @route   GET /api/patients
exports.getPatients = async (req, res) => {
  try {
    const professionalId = req.user._id;

    const patients = await Patient.find({
      professionalId,
      isActive: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération des patients' });
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
exports.getPatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Vérifier que le patient appartient au professionnel
    if (patient.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    res.json({
      success: true,
      patient,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération du patient' });
  }
};

// @desc    Update patient
// @route   PUT /api/patients/:id
exports.updatePatient = async (req, res) => {
  try {
    let patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Vérifier que le patient appartient au professionnel
    if (patient.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      patient,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du patient' });
  }
};

// @desc    Delete patient (soft delete)
// @route   DELETE /api/patients/:id
exports.deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Vérifier que le patient appartient au professionnel
    if (patient.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Soft delete
    patient.isActive = false;
    await patient.save();

    res.json({
      success: true,
      message: 'Patient désactivé',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression du patient' });
  }
};

// @desc    Resend magic link
// @route   POST /api/patients/:id/resend-magic-link
exports.resendMagicLink = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);

    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Vérifier que le patient appartient au professionnel
    if (patient.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Générer nouveau magic link
    const token = patient.generateMagicLink();
    await patient.save();

    // Envoyer l'email
    await emailService.sendMagicLink(
      patient.email,
      token,
      `${patient.firstName} ${patient.lastName}`
    );

    res.json({
      success: true,
      message: 'Email de connexion renvoyé',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du lien' });
  }
};

// @desc    Get patient profile (for patient)
// @route   GET /api/patients/me
exports.getMyProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.patient._id)
      .populate('professionalId', 'firstName lastName profession phone');

    res.json({
      success: true,
      patient,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Update patient RGPD consent
// @route   PUT /api/patients/me/rgpd
exports.updateRGPDConsent = async (req, res) => {
  try {
    const { consent } = req.body;

    const patient = await Patient.findById(req.patient._id);

    patient.rgpdConsent = consent;
    patient.rgpdConsentDate = consent ? new Date() : null;
    await patient.save();

    res.json({
      success: true,
      patient,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};