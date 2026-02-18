const { getGeminiModel } = require('../config/gemini');

const SYSTEM_PROMPT = `Tu es Julia, une assistante thérapeutique bienveillante et empathique.

Ton rôle est d'écouter les patients entre leurs séances avec leur thérapeute et de les aider à :
- Exprimer leurs émotions et pensées
- Trouver de l'apaisement
- Identifier des solutions immédiates
- Décider s'ils ont besoin de contacter leur thérapeute

Règles importantes :
- Tu ne remplaces PAS un thérapeute humain
- Tu ne poses PAS de diagnostic
- Tu encourages à consulter le thérapeute en cas de crise
- Tu restes positive et soutenante
- Tu poses des questions ouvertes pour encourager l'expression
- Tu valides les émotions sans jugement

Si tu détectes une urgence (idées suicidaires, violence), tu recommandes IMMÉDIATEMENT de contacter le thérapeute ou les urgences.`;

exports.generateChatResponse = async (messages, patientContext = {}) => {
  try {
    const model = getGeminiModel();

    // Construire le contexte du patient
    const contextPrompt = `
Contexte patient:
- Prénom: ${patientContext.firstName || 'Non renseigné'}
- Sujet thérapie: ${patientContext.therapySubject || 'Non renseigné'}
- Dernière séance: ${patientContext.lastSessionDate ? new Date(patientContext.lastSessionDate).toLocaleDateString('fr-FR') : 'Aucune'}
- Prochaine séance: ${patientContext.nextSessionDate ? new Date(patientContext.nextSessionDate).toLocaleDateString('fr-FR') : 'Non programmée'}
`;

    // Séparer l'historique précédent du dernier message utilisateur
    // Gemini attend : history = messages précédents, sendMessage = dernier message
    const allMessages = messages.map(msg => {
      const role = msg.sender === 'patient' ? 'user' : 'model';
      return { role, parts: [{ text: msg.content }] };
    });

    // L'historique = tous les messages SAUF le dernier (qui sera envoyé via sendMessage)
    const history = allMessages.slice(0, -1);
    const lastMessage = allMessages[allMessages.length - 1];

    // S'assurer que l'historique alterne correctement user/model (requis par Gemini)
    const cleanHistory = [];
    for (let i = 0; i < history.length; i++) {
      const msg = history[i];
      if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === msg.role) {
        // Fusionner les messages consécutifs du même rôle
        cleanHistory[cleanHistory.length - 1].parts[0].text += '\n' + msg.parts[0].text;
      } else {
        cleanHistory.push({ role: msg.role, parts: [{ text: msg.parts[0].text }] });
      }
    }

    const chat = model.startChat({
      history: cleanHistory,
      systemInstruction: {
        parts: [{ text: `${SYSTEM_PROMPT}\n\n${contextPrompt}` }],
      },
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
      },
    });

    // Envoyer le dernier message de l'utilisateur pour obtenir la réponse IA
    const result = await chat.sendMessage(lastMessage.parts[0].text);

    const response = await result.response;
    const text = response.text();

    // Détection d'urgence simple (à améliorer)
    const urgencyKeywords = [
      'suicide',
      'me tuer',
      'en finir',
      'plus envie de vivre',
      'mourir',
      'violence',
    ];
    
    const urgencyDetected = urgencyKeywords.some(keyword =>
      text.toLowerCase().includes(keyword)
    );

    return {
      response: text,
      urgencyDetected,
    };
  } catch (error) {
    console.error('Erreur Gemini:', error);

    // Si quota dépassé (429), renvoyer un message fallback au lieu de crasher
    if (error.status === 429) {
      const fallbackResponses = [
        'Je suis là pour vous écouter. Je rencontre un petit souci technique en ce moment, mais je vous invite à partager ce que vous ressentez. Votre thérapeute pourra y avoir accès lors de votre prochaine séance.',
        'Merci de me faire confiance. Je suis momentanément limitée techniquement, mais vos messages sont bien reçus et conservés. Votre thérapeute reste disponible si vous avez besoin d\'un soutien immédiat.',
        'Je vous lis et je vous entends. Je traverse une petite limitation technique, mais prenez le temps d\'exprimer ce que vous ressentez ici — tout est enregistré pour votre suivi.',
      ];
      const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return {
        response: randomFallback,
        urgencyDetected: false,
      };
    }

    // Fallback générique pour toute autre erreur
    return {
      response: 'Je suis momentanément indisponible. Si vous traversez un moment difficile, n\'hésitez pas à contacter directement votre thérapeute.',
      urgencyDetected: false,
    };
  }
};

exports.generateConversationSummary = async (messages) => {
  try {
    const model = getGeminiModel();

    const conversationText = messages
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    const prompt = `Analyse cette conversation entre un patient et un assistant IA thérapeutique.

Conversation:
${conversationText}

Génère une synthèse au format JSON avec:
1. keywords: tableau de 3-5 mots-clés principaux
2. mainConcern: une phrase décrivant la préoccupation principale
3. urgencyDetected: boolean indiquant si une urgence est détectée
4. recommendedAction: suggestion d'action pour le thérapeute

Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parser le JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback si parsing échoue
    return {
      keywords: ['conversation', 'échange'],
      mainConcern: 'Discussion générale',
      urgencyDetected: false,
      recommendedAction: 'Suivi normal',
    };
  } catch (error) {
    console.error('Erreur génération synthèse:', error);
    return {
      keywords: ['erreur'],
      mainConcern: 'Erreur de synthèse',
      urgencyDetected: false,
      recommendedAction: 'Vérifier manuellement',
    };
  }
};

exports.analyzeSessionNotes = async (extractedText) => {
  try {
    const model = getGeminiModel();

    const prompt = `Analyse ces notes de séance thérapeutique et génère une synthèse structurée.

Notes:
${extractedText}

Génère une synthèse en français incluant:
- Points clés abordés
- Évolutions notables
- Objectifs pour la prochaine séance
- Observations importantes

Limite: 300 mots maximum.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Erreur analyse notes:', error);
    throw new Error('Erreur lors de l\'analyse des notes');
  }
};