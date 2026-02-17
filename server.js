require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/database');


const PORT = process.env.PORT;

connectDB();

const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur Julia-App démarré sur le port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Erreur non gérée:', err);
  server.close(() => process.exit(1));
});