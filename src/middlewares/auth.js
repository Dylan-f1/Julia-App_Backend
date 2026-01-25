const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Patient = require('../models/Patient');

// Middleware pour protéger les routes professionnels
exports.protectProfessional = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Non autorisé - Utilisateur non trouvé' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Non autorisé - Token invalide' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé - Pas de token' });
  }
};

// Middleware pour protéger les routes patients
exports.protectPatient = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.patient = await Patient.findById(decoded.id);

      if (!req.patient) {
        return res.status(401).json({ message: 'Non autorisé - Patient non trouvé' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Non autorisé - Token invalide' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Non autorisé - Pas de token' });
  }
};