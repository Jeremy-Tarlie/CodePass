import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Import des routes
import authRoutes from './routes/auth.routes';
import passwordRoutes from './routes/password.routes';
import passwordResetRoutes from './routes/passwordReset.routes';

// // Import des middleware de sécurité
import { 
  helmetConfig, 
  generalRateLimit, 
  speedLimiter, 
  validateIP, 
  cleanupSessions, 
  securityHeaders 
} from './middleware/security.middleware';

// // Import des nouveaux middleware
import { 
  sanitizeInput, 
  validateContentType, 
  validateDataSize, 
  validateUrlParams
} from './middleware/validation.middleware';

import { 
  errorLogger,
  getMetrics as getLoggingMetrics,
  cleanupLogs
} from './middleware/logging.middleware';

import { 
  getSystemMetrics,
  getHealthStatus,
  resolveAlert
} from './middleware/monitoring.middleware';

import { 
  validateApiKey
} from './middleware/apiKey.middleware';

// Configuration des variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

// Configuration trust proxy pour Docker/Reverse Proxy (plus sécurisé)
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);

// Configuration CORS
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Récupérer les origines autorisées depuis l'environnement
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());
    
    // En développement, accepter toutes les origines
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // En production, vérifier l'origine
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
};

// Middleware de base
app.use(helmetConfig);
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' })); // Réduire la limite
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Servir les fichiers statiques (pour reset-password.html)
app.use(express.static('public'));

// Middleware de sécurité
app.use(validateIP);
app.use(cleanupSessions);
app.use(securityHeaders);
app.use(speedLimiter);

// Middleware de validation et sanitisation
app.use(sanitizeInput);
app.use(validateContentType);
app.use(validateDataSize(5 * 1024 * 1024)); // 5MB max
app.use(validateUrlParams);

// Middleware de limitation de taux global
app.use(generalRateLimit);

// Routes de santé et monitoring (sans authentification)
app.get('/health', getHealthStatus);
app.get('/metrics', getSystemMetrics);
app.get('/logs/metrics', getLoggingMetrics);
app.post('/alerts/:alertId/resolve', resolveAlert);

// Route pour la configuration API (pour reset-password.html)
app.get('/api/config', (_req, res) => {
  res.json({
    API_BASE_URL: process.env.BACKEND_URL || 'https://gestion-mdp.codepath.fr',
    API_KEY: process.env.API_KEY
  });
});

// Routes API avec authentification par clé API
app.use('/api/auth', 
  // validateApiKey,
   authRoutes);
app.use('/api/passwords', validateApiKey, passwordRoutes);
// app.use('/api/keys', apiKeyRoutes); // SUPPRIMÉ pour la sécurité
app.use('/api/password-reset', validateApiKey, passwordResetRoutes);

// Route 404
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Middleware de gestion d'erreurs global
app.use(errorLogger);
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erreur non gérée:', err);
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Fonction de démarrage du serveur
async function startServer() {
  try {
    // Test de connexion à la base de données
    await prisma.$connect();
    console.log('✅ Connexion à la base de données établie');

    // Démarrage du serveur
    app.listen(PORT, () => {
      console.log(`🚀 Serveur démarré sur le port ${PORT}`);
      console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Mode sécurisé activé`);
      console.log(`📈 Monitoring activé - /health, /metrics`);
      console.log(`📝 Logging avancé activé`);
      
      // Nettoyage périodique des logs
      setInterval(cleanupLogs, 24 * 60 * 60 * 1000); // Tous les jours
    });

  } catch (error) {
    console.error('❌ Erreur lors du démarrage du serveur:', error);
    process.exit(1);
  }
}

// Gestion propre de l'arrêt du serveur
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

// Démarrage du serveur
startServer();