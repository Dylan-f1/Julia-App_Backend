const Conversation = require('../models/Conversation');
const Patient = require('../models/Patient');
const geminiService = require('../services/geminiService');
const notificationService = require('../services/notificationService');

// @desc    Start new conversation
// @route   POST /api/conversations
exports.startConversation = async (req, res) => {
  try {
    const patientId = req.patient._id;
    const { firstMessage } = req.body;

    const patient = await Patient.findById(patientId).populate('professionalId');

    // Vérifier si une conversation active existe
    let conversation = await Conversation.findOne({
      patientId,
      status: 'active',
    });

    if (!conversation) {
      // Créer nouvelle conversation
      conversation = await Conversation.create({
        patientId,
        professionalId: patient.professionalId._id,
        messages: [],
      });

      // Notifier le professionnel
      await notificationService.notifyConversationStarted(
        patient.professionalId._id,
        patientId,
        conversation._id
      );
    }

    // Ajouter le message du patient
    conversation.messages.push({
      sender: 'patient',
      content: firstMessage,
      color: 'blue',
      timestamp: new Date(),
    });

    // Préparer le contexte patient pour l'IA
    const patientContext = {
      firstName: patient.firstName,
      therapySubject: patient.therapySubject,
      lastSessionDate: patient.lastSessionDate,
      nextSessionDate: patient.nextSessionDate,
    };

    // Générer réponse IA
    const aiResponse = await geminiService.generateChatResponse(
      conversation.messages,
      patientContext
    );

    // Ajouter la réponse de l'IA
    conversation.messages.push({
      sender: 'ai',
      content: aiResponse.response,
      color: 'green',
      timestamp: new Date(),
    });

    await conversation.save();

    res.status(201).json({
      success: true,
      conversation,
      urgencyDetected: aiResponse.urgencyDetected,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors du démarrage de la conversation' });
  }
};

// @desc    Send message in conversation
// @route   POST /api/conversations/:id/messages
exports.sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const conversationId = req.params.id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Vérifier autorisation
    if (conversation.patientId.toString() !== req.patient._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Ajouter message patient
    conversation.messages.push({
      sender: 'patient',
      content: message,
      color: 'blue',
      timestamp: new Date(),
    });

    // Récupérer infos patient
    const patient = await Patient.findById(req.patient._id);
    const patientContext = {
      firstName: patient.firstName,
      therapySubject: patient.therapySubject,
      lastSessionDate: patient.lastSessionDate,
      nextSessionDate: patient.nextSessionDate,
    };

    // Générer réponse IA
    const aiResponse = await geminiService.generateChatResponse(
      conversation.messages,
      patientContext
    );

    // Ajouter réponse IA
    conversation.messages.push({
      sender: 'ai',
      content: aiResponse.response,
      color: 'green',
      timestamp: new Date(),
    });

    await conversation.save();

    res.json({
      success: true,
      conversation,
      urgencyDetected: aiResponse.urgencyDetected,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
};

// @desc    Close conversation with evaluation
// @route   POST /api/conversations/:id/close
exports.closeConversation = async (req, res) => {
  try {
    const { gravityLevel } = req.body;
    const conversationId = req.params.id;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Vérifier autorisation
    if (conversation.patientId.toString() !== req.patient._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    // Générer synthèse avec IA
    const summary = await geminiService.generateConversationSummary(conversation.messages);

    // Mettre à jour la conversation
    conversation.status = 'closed';
    conversation.closedAt = new Date();
    conversation.evaluation = {
      gravityLevel,
      timestamp: new Date(),
      rationality: true, // À améliorer
    };
    conversation.summary = {
      keywords: summary.keywords || [],
      mainConcern: summary.mainConcern || '',
      urgencyDetected: summary.urgencyDetected || false,
      generatedAt: new Date(),
    };

    await conversation.save();

    // Si gravité élevée, notifier le professionnel
    if (gravityLevel === 3 || summary.urgencyDetected) {
      await notificationService.notifyHighGravity(
        conversation.professionalId,
        conversation.patientId,
        conversation._id
      );
    }

    // Mettre à jour le score du patient
    const patient = await Patient.findById(conversation.patientId);
    patient.currentScore = (10 - gravityLevel * 3); // Score inverse
    await patient.save();

    res.json({
      success: true,
      conversation,
      message: 'Conversation terminée avec succès',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la fermeture de la conversation' });
  }
};

// @desc    Get active conversation for patient
// @route   GET /api/conversations/active
exports.getActiveConversation = async (req, res) => {
  try {
    const patientId = req.patient._id;

    const conversation = await Conversation.findOne({
      patientId,
      status: 'active',
    });

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Get conversation history for patient
// @route   GET /api/conversations/history
exports.getConversationHistory = async (req, res) => {
  try {
    const patientId = req.patient._id;

    const conversations = await Conversation.find({
      patientId,
      status: 'closed',
    })
      .sort({ closedAt: -1 })
      .limit(20);

    res.json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Get conversations for professional
// @route   GET /api/conversations/professional
exports.getConversationsForProfessional = async (req, res) => {
  try {
    const professionalId = req.user._id;
    const { patientId, status } = req.query;

    const filter = { professionalId };
    if (patientId) filter.patientId = patientId;
    if (status) filter.status = status;

    const conversations = await Conversation.find(filter)
      .populate('patientId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// @desc    Get single conversation (professional)
// @route   GET /api/conversations/:id
exports.getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id)
      .populate('patientId', 'firstName lastName email therapySubject');

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }

    // Vérifier autorisation
    if (conversation.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};