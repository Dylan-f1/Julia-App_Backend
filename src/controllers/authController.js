const User = require('../models/User');
const Patient = require('../models/Patient');
const { generateToken } = require('../utils/jwt');
const { hashToken } = require('../utils/generateMagicLink');
const emailService = require('../services/emailService');
const crypto = require('crypto');

// @desc    Register professional
// @route   POST /api/auth/register
exports.registerProfessional = async (req, res) => {
  try {
    const { email, password, firstName, lastName, profession, workLocation, consultationType, phone } = req.body;

    // Vérifier si l'utilisateur existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    // Créer l'utilisateur
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      profession,
      workLocation,
      consultationType,
      phone,
    });

    // Envoyer email de bienvenue
    await emailService.sendWelcomeEmail(email, firstName);

    // Générer token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profession: user.profession,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
};

// @desc    Login professional
// @route   POST /api/auth/login
exports.loginProfessional = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifier l'utilisateur
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Vérifier le mot de passe
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Générer token
    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profession: user.profession,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
};

// @desc    Send magic link to patient
// @route   POST /api/auth/magic-link
exports.sendMagicLink = async (req, res) => {
  try {
    const { patientId } = req.body;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient non trouvé' });
    }

    // Générer magic link token
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
      message: 'Email de connexion envoyé',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du lien' });
  }
};

// @desc    Verify magic link
// @route   POST /api/auth/verify-magic-link
exports.verifyMagicLink = async (req, res) => {
  try {
    const { token } = req.body;

    // Hash le token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Trouver le patient
    const patient = await Patient.findOne({
      magicLinkToken: hashedToken,
      magicLinkExpiry: { $gt: Date.now() },
    });

    if (!patient) {
      return res.status(401).json({ message: 'Lien invalide ou expiré' });
    }

    // Nettoyer le token
    patient.magicLinkToken = undefined;
    patient.magicLinkExpiry = undefined;
    await patient.save();

    // Générer JWT
    const jwtToken = generateToken(patient._id);

    res.json({
      success: true,
      token: jwtToken,
      patient: {
        id: patient._id,
        email: patient.email,
        firstName: patient.firstName,
        lastName: patient.lastName,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la vérification' });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = req.user || req.patient;
    
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};