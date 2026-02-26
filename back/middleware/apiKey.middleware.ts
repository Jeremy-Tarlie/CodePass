import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * Middleware d'authentification par clé API
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction): Response | void => {
  try {
    // Récupérer la clé API depuis les headers
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Clé API manquante. Veuillez fournir une clé API dans le header X-API-Key'
      });
    }

    // Récupérer la clé API configurée dans l'environnement (pas de valeur par défaut en production)
    const validApiKey = process.env.API_KEY
      || (process.env.NODE_ENV === 'production' ? undefined : 'default-api-key-for-development');
    
    if (!validApiKey) {
      console.error('API_KEY non configurée dans les variables d\'environnement');
      return res.status(500).json({
        success: false,
        message: 'Configuration serveur invalide'
      });
    }

    // Comparer les clés de manière sécurisée (timing-safe comparison)
    const keyBuf = Buffer.from(apiKey, 'utf8');
    const validBuf = Buffer.from(validApiKey, 'utf8');
    const isValid = keyBuf.length === validBuf.length && crypto.timingSafeEqual(keyBuf, validBuf);

    if (!isValid) {
      // Log de sécurité pour les tentatives d'accès avec une clé invalide
      console.warn(`Tentative d'accès avec une clé API invalide depuis IP: ${req.ip}`);
      
      return res.status(403).json({
        success: false,
        message: 'Clé API invalide'
      });
    }

    // Ajouter des informations de sécurité à la requête
    (req as any).apiKeyValidated = true;
    (req as any).apiKeyTimestamp = Date.now();

    next();
  } catch (error) {
    console.error('Erreur lors de la validation de la clé API:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Middleware optionnel de validation de clé API (ne bloque pas si pas de clé)
 */
export const optionalApiKey = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (apiKey) {
      const validApiKey = process.env.API_KEY;
      
      if (validApiKey) {
        const keyBuf = Buffer.from(apiKey, 'utf8');
        const validBuf = Buffer.from(validApiKey, 'utf8');
        const isValid = keyBuf.length === validBuf.length && crypto.timingSafeEqual(keyBuf, validBuf);

        if (isValid) {
          (req as any).apiKeyValidated = true;
          (req as any).apiKeyTimestamp = Date.now();
        }
      }
    }
    
    next();
  } catch (error) {
    console.error('Erreur lors de la validation optionnelle de la clé API:', error);
    next(); // Continue même en cas d'erreur
  }
};

/**
 * Middleware de validation de clé API avec rate limiting spécifique
 */
export const validateApiKeyWithRateLimit = (req: Request, res: Response, next: NextFunction): Response | void => {
  // D'abord valider la clé API
  const apiKeyValidation = validateApiKey(req, res, next);
  
  if (apiKeyValidation) {
    return apiKeyValidation;
  }

  // Si la clé est valide, appliquer un rate limiting plus permissif
  // (ceci sera géré par le middleware de rate limiting existant)
  next();
};

/**
 * Middleware de génération de clé API (pour l'administration)
 */
export const generateApiKey = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Middleware de validation de clé API avec rotation
 */
export const validateApiKeyWithRotation = (req: Request, res: Response, next: NextFunction): Response | void => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'Clé API manquante'
      });
    }

    // Vérifier la clé principale
    const primaryApiKey = process.env.API_KEY;
    const secondaryApiKey = process.env.API_KEY_SECONDARY; // Clé de rotation

    let isValid = false;

    const keyBuf = Buffer.from(apiKey, 'utf8');
    if (primaryApiKey) {
      const primaryBuf = Buffer.from(primaryApiKey, 'utf8');
      isValid = keyBuf.length === primaryBuf.length && crypto.timingSafeEqual(keyBuf, primaryBuf);
    }

    // Si la clé principale n'est pas valide, vérifier la clé secondaire
    if (!isValid && secondaryApiKey) {
      const secondaryBuf = Buffer.from(secondaryApiKey, 'utf8');
      isValid = keyBuf.length === secondaryBuf.length && crypto.timingSafeEqual(keyBuf, secondaryBuf);
    }

    if (!isValid) {
      console.warn(`Tentative d'accès avec une clé API invalide depuis IP: ${req.ip}`);
      return res.status(403).json({
        success: false,
        message: 'Clé API invalide'
      });
    }

    (req as any).apiKeyValidated = true;
    (req as any).apiKeyTimestamp = Date.now();

    next();
  } catch (error) {
    console.error('Erreur lors de la validation de la clé API avec rotation:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Middleware de logging des accès API
 */
export const logApiAccess = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  const apiKey = req.headers['x-api-key'] as string;
  const maskedApiKey = apiKey ? `${apiKey.substring(0, 8)}...` : 'none';

  const originalSend = res.send;
  res.send = function(data) {
    // Vérifier si la réponse a déjà été envoyée pour éviter la récursion
    if (res.headersSent) {
      return this;
    }
    
    const responseTime = Date.now() - start;
    
    console.log(`API Access - ${req.method} ${req.originalUrl} - Key: ${maskedApiKey} - IP: ${req.ip} - Status: ${res.statusCode} - Time: ${responseTime}ms`);
    
    return originalSend.call(this, data);
  };
  
  next();
};
