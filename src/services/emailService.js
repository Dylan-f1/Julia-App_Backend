const mailjet = require('../config/mailjet');

exports.sendMagicLink = async (email, token, patientName) => {
  if (!mailjet) {
    console.log('⚠️ Mailjet non configuré - Email non envoyé');
    console.log(`📧 Magic link pour ${email}: ${process.env.FRONTEND_URL}/auth/verify-magic-link?token=${token}`);
    return { success: true, message: 'Mailjet non configuré - lien affiché en console' };
  }

  const magicLink = `${process.env.FRONTEND_URL}/auth/verify-magic-link?token=${token}`;

  try {
    const result = await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL,
            Name: process.env.MAILJET_FROM_NAME,
          },
          To: [
            {
              Email: email,
              Name: patientName || 'Patient',
            },
          ],
          Subject: 'Connexion à Julia App',
          TextPart: `Bonjour,\n\nCliquez sur ce lien pour vous connecter à Julia App:\n${magicLink}\n\nCe lien est valide pendant 24h.\n\nÀ bientôt,\nL'équipe Julia`,
          HTMLPart: `
            <h3>Bonjour,</h3>
            <p>Cliquez sur le bouton ci-dessous pour vous connecter à Julia App:</p>
            <a href="${magicLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Se connecter
            </a>
            <p><small>Ce lien est valide pendant 24h.</small></p>
            <p>À bientôt,<br>L'équipe Julia</p>
          `,
        },
      ],
    });

    console.log('✅ Email envoyé:', result.body);
    return { success: true };
  } catch (error) {
    console.error('❌ Erreur envoi email:', error);
    throw new Error('Erreur lors de l\'envoi de l\'email');
  }
};

exports.sendWelcomeEmail = async (email, firstName) => {
  if (!mailjet) {
    console.log('⚠️ Mailjet non configuré - Email de bienvenue non envoyé');
    return;
  }

  try {
    await mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL,
            Name: process.env.MAILJET_FROM_NAME,
          },
          To: [
            {
              Email: email,
              Name: firstName,
            },
          ],
          Subject: 'Bienvenue sur Julia App',
          HTMLPart: `
            <h2>Bienvenue ${firstName} !</h2>
            <p>Votre compte professionnel Julia App a été créé avec succès.</p>
            <p>Vous pouvez maintenant commencer à créer des profils patients et leur envoyer des liens de connexion.</p>
          `,
        },
      ],
    });
  } catch (error) {
    console.error('Erreur envoi email bienvenue:', error);
  }
};