let mailjet = null;

if (process.env.MAILJET_API_KEY && process.env.MAILJET_SECRET_KEY) {
  mailjet = require('node-mailjet').apiConnect(
    process.env.MAILJET_API_KEY,
    process.env.MAILJET_SECRET_KEY
  );
  console.log('Mailjet configuré');
} else {
  console.log('⚠️ Mailjet non configuré (clés manquantes)');
}

module.exports = mailjet;