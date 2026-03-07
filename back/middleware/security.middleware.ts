import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import helmet from 'helmet';
import { prisma } from '../db';

/**
 * Configuration Helmet pour la sécurité des headers
 */
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Limitation du taux de requêtes général
 */
export const generalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requêtes par fenêtre
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      message: 'Trop de requêtes, veuillez réessayer plus tard'
    });
  }
});

/**
 * Limitation du taux de requêtes pour l'authentification
 */
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives de connexion par fenêtre
  message: {
    success: false,
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne pas compter les connexions réussies
  handler: async (req: Request, res: Response) => {
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    // Log de sécurité pour les tentatives excessives
    await prisma.securityLog.create({
      data: {
        userId: null,
        action: 'RATE_LIMIT_EXCEEDED',
        ipAddress,
        userAgent,
        success: false,
        details: 'Trop de tentatives de connexion'
      }
    });

    res.status(429).json({
      success: false,
      message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes'
    });
  }
});

/**
 * Ralentissement progressif pour les requêtes répétées
 */
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Commencer à ralentir après 50 requêtes
  delayMs: () => 500, // Ralentir de 500ms par requête supplémentaire
  maxDelayMs: 20000, // Maximum 20 secondes de délai
});

/**
 * Middleware de validation de l'IP
 */
export const validateIP = (req: Request, res: Response, next: NextFunction): Response | void => {
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Liste des IPs bloquées (à configurer selon vos besoins)
  const blockedIPs = process.env.BLOCKED_IPS?.split(',') || [];
  
  if (blockedIPs.includes(ipAddress)) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé'
    });
  }
  
  next();
};

/**
 * Middleware de logging des requêtes
 */
export const requestLogger = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const start = Date.now();
  const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Log de la requête
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${ipAddress}`);
  
  // Intercepter la réponse pour logger le temps de traitement
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware de nettoyage des sessions expirées
 */
export const cleanupSessions = async (_req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // Nettoyer les sessions expirées toutes les 10 requêtes (approximation)
    if (Math.random() < 0.1) {
      await prisma.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
    }
    next();
  } catch (error) {
    console.error('Erreur lors du nettoyage des sessions:', error);
    next(); // Continuer même en cas d'erreur
  }
};

/**
 * Middleware de validation des headers de sécurité
 */
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Ajouter des headers de sécurité supplémentaires
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};