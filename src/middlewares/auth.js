const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');

// Middleware pour protéger les routes professionnels
exports.protectProfessional = async (req, res, next) => {
  try {
    // Vérifier la présence du header Authorization
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
      console.log('❌ protectProfessional: Pas de token');
      return res.status(401).json({ message: 'Non autorisé - Pas de token' });
    }

    // Extraire le token
    const token = req.headers.authorization.split(' ')[1];
    console.log('🔐 protectProfessional: Token reçu');

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 protectProfessional: Token décodé, userId:', decoded.id);

    // Récupérer l'utilisateur
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      console.log('❌ protectProfessional: Utilisateur non trouvé:', decoded.id);
      return res.status(401).json({ message: 'Non autorisé - Utilisateur non trouvé' });
    }

    console.log('✅ protectProfessional: Utilisateur authentifié:', req.user.email);
    next();
  } catch (error) {
    console.error('❌ protectProfessional: Erreur -', error.message);
    return res.status(401).json({ message: 'Non autorisé - Token invalide' });
  }
};

// Middleware pour protéger les routes patients
exports.protectPatient = async (req, res, next) => {
  try {
    // Vérifier la présence du header Authorization
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer')) {
      console.log('❌ protectPatient: Pas de token');
      return res.status(401).json({ message: 'Non autorisé - Pas de token' });
    }

    // Extraire le token
    const token = req.headers.authorization.split(' ')[1];
    console.log('🔐 protectPatient: Token reçu');

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 protectPatient: Token décodé, patientId:', decoded.id);

    // Récupérer le patient
    req.patient = await Patient.findById(decoded.id);

    if (!req.patient) {
      console.log('❌ protectPatient: Patient non trouvé:', decoded.id);
      return res.status(401).json({ message: 'Non autorisé - Patient non trouvé' });
    }

    console.log('✅ protectPatient: Patient authentifié:', req.patient.email);
    
    // Ajouter userId pour compatibilité avec certaines routes
    req.userId = req.patient._id;
    
    next();
  } catch (error) {
    console.error('❌ protectPatient: Erreur -', error.message);
    return res.status(401).json({ message: 'Non autorisé - Token invalide' });
  }
};