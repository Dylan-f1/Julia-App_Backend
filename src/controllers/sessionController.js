const SessionNote = require('../models/SessionNote');
const Patient = require('../models/Patient');
const s3Service = require('../services/s3Service');
const geminiService = require('../services/geminiService');
const multer = require('multer');

// Configuration Multer pour upload en mémoire
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non autorisé'), false);
    }
  },
});

// @desc    Upload session note
// @route   POST /api/sessions
exports.uploadSessionNote = async (req, res) => {
  try {
    const { patientId, sessionDate } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    // Vérifier que le patient appartient au professionnel
    const patient = await Patient.findById(patientId);
    if (!patient || patient.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Upload vers S3
    const s3Result = await s3Service.uploadFile(file, 'session-notes');

    // Créer la note de session
    const sessionNote = await SessionNote.create({
      patientId,
      professionalId: req.user._id,
      sessionDate: sessionDate || new Date(),
      fileUrl: s3Result.url,
      fileName: file.originalname,
      fileSize: file.size,
    });

    res.status(201).json({
      success: true,
      sessionNote,
      message: 'Fichier uploadé avec succès',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'upload du fichier' });
  }
};

// Middleware multer
exports.uploadMiddleware = upload.single('file');

// @desc    Process session note with OCR (à implémenter)
// @route   POST /api/sessions/:id/process
exports.processSessionNote = async (req, res) => {
  try {
    const sessionNote = await SessionNote.findById(req.params.id);

    if (!sessionNote) {
      return res.status(404).json({ message: 'Note de session non trouvée' });
    }

    // Vérifier autorisation
    if (sessionNote.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // TODO: Implémenter OCR ici
    // const extractedText = await ocrService.extractText(sessionNote.fileUrl);
    const extractedText = "Texte extrait temporaire (OCR à implémenter)";

    // Générer synthèse avec IA
    const aiSummary = await geminiService.analyzeSessionNotes(extractedText);

    // Mettre à jour la note
    sessionNote.extractedText = extractedText;
    sessionNote.aiSummary = aiSummary;
    sessionNote.isProcessed = true;
    await sessionNote.save();

    res.json({
      success: true,
      sessionNote,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors du traitement du fichier' });
  }
};

// @desc    Get session notes for a patient
// @route   GET /api/sessions/patient/:patientId
exports.getSessionNotes = async (req, res) => {
  try {
    const { patientId } = req.params;

    // Vérifier que le patient appartient au professionnel
    const patient = await Patient.findById(patientId);
    if (!patient || patient.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const sessionNotes = await SessionNote.find({
      patientId,
      professionalId: req.user._id,
    }).sort({ sessionDate: -1 });

    res.json({
      success: true,
      count: sessionNotes.length,
      sessionNotes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Get single session note
// @route   GET /api/sessions/:id
exports.getSessionNote = async (req, res) => {
  try {
    const sessionNote = await SessionNote.findById(req.params.id)
      .populate('patientId', 'firstName lastName');

    if (!sessionNote) {
      return res.status(404).json({ message: 'Note de session non trouvée' });
    }

    // Vérifier autorisation
    if (sessionNote.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Générer signed URL pour accès temporaire au fichier
    const signedUrl = await s3Service.getSignedUrl(sessionNote.fileUrl);

    res.json({
      success: true,
      sessionNote: {
        ...sessionNote.toObject(),
        signedUrl,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Delete session note
// @route   DELETE /api/sessions/:id
exports.deleteSessionNote = async (req, res) => {
  try {
    const sessionNote = await SessionNote.findById(req.params.id);

    if (!sessionNote) {
      return res.status(404).json({ message: 'Note de session non trouvée' });
    }

    // Vérifier autorisation
    if (sessionNote.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Supprimer le fichier de S3
    await s3Service.deleteFile(sessionNote.fileUrl);

    // Supprimer la note
    await sessionNote.remove();

    res.json({
      success: true,
      message: 'Note de session supprimée',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la suppression' });
  }
};