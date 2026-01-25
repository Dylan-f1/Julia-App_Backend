require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');


const PORT = process.env.PORT || 5000;

// Connexion à MongoDB
connectDB();

// Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur Julia-App démarré sur le port ${PORT}`);
  console.log(`📍 Environnement: ${process.env.NODE_ENV}`);
});

// Gestion des erreurs non gérées
process.on('unhandledRejection', (err) => {
  console.error('❌ Erreur non gérée:', err);
  server.close(() => process.exit(1));
});