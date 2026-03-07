import { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import { prisma } from '../db';

/**
 * Middleware de compression intelligent
 */
export const smartCompression = compression({
  // Compression seulement pour les réponses > 1KB
  threshold: 1024,
  
  // Niveau de compression (1-9, 6 par défaut)
  level: 6,
  
  // Types de contenu à compresser
  filter: (req: Request, res: Response) => {
    // Ne pas compresser si le client ne le supporte pas
    if (req.headers['x-no-compression']) {
      return false;
    }
    
    // Utiliser la compression par défaut
    return compression.filter(req, res);
  }
});

/**
 * Middleware de cache des réponses
 */
export const responseCache = (duration: number = 300) => { // 5 minutes par défaut
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    // Ne pas mettre en cache les requêtes d'authentification
    if (req.path.includes('/auth') || req.method !== 'GET') {
      return next();
    }
    
    // Headers de cache
    res.set({
      'Cache-Control': `public, max-age=${duration}`,
      'ETag': `"${Date.now()}"`,
      'Last-Modified': new Date().toUTCString()
    });
    
    // Vérifier les headers de cache du client
    const ifNoneMatch = req.headers['if-none-match'];
    const ifModifiedSince = req.headers['if-modified-since'];
    
    if (ifNoneMatch || ifModifiedSince) {
      // Le client a déjà la version en cache
      return res.status(304).end();
    }
    
    next();
  };
};

/**
 * Middleware de pagination automatique
 */
export const autoPagination = (defaultLimit: number = 20, maxLimit: number = 100) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit as string) || defaultLimit));
    const offset = (page - 1) * limit;
    
    // Ajouter les paramètres de pagination à la requête
    (req as any).pagination = {
      page,
      limit,
      offset,
      skip: offset,
      take: limit
    };
    
    next();
  };
};

/**
 * Middleware de formatage des réponses
 */
export const responseFormatter = (req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Vérifier si la réponse a déjà été envoyée pour éviter la récursion
    if (res.headersSent) {
      return this;
    }
    
    // Si c'est déjà un objet avec success, ne pas le modifier
    if (typeof data === 'object' && data !== null && 'success' in data) {
      return originalSend.call(this, data);
    }
    
    // Formater la réponse avec pagination si disponible
    const pagination = (req as any).pagination;
    if (pagination && Array.isArray(data)) {
      const formattedResponse = {
        success: true,
        data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: data.length,
          hasNext: data.length === pagination.limit
        },
        timestamp: new Date().toISOString()
      };
      return originalSend.call(this, formattedResponse);
    }
    
    // Formater une réponse simple
    const formattedResponse = {
      success: true,
      data,
      timestamp: new Date().toISOString()
    };
    
    return originalSend.call(this, formattedResponse);
  };
  
  next();
};

/**
 * Middleware de limitation de la taille des réponses
 */
export const responseSizeLimit = (maxSize: number = 10 * 1024 * 1024) => { // 10MB par défaut
  return (_req: Request, res: Response, next: NextFunction): Response | void => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Vérifier si la réponse a déjà été envoyée pour éviter la récursion
      if (res.headersSent) {
        return this;
      }
      
      const dataSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
      
      if (dataSize > maxSize) {
        return res.status(413).json({
          success: false,
          message: 'Réponse trop volumineuse',
          maxSize: maxSize,
          actualSize: dataSize
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware de nettoyage des données sensibles
 */
export const sanitizeResponse = (_req: Request, res: Response, next: NextFunction): void => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Vérifier si la réponse a déjà été envoyée pour éviter la récursion
    if (res.headersSent) {
      return this;
    }
    
    if (typeof data === 'object' && data !== null) {
      // Supprimer les données sensibles des réponses
      const sanitizedData = removeSensitiveData(data);
      return originalSend.call(this, sanitizedData);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Fonction pour supprimer les données sensibles
 */
function removeSensitiveData(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(removeSensitiveData);
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Champs sensibles à supprimer
      const sensitiveFields = [
        'password', 'encryptionKey', 'twoFactorSecret', 
        'token', 'refreshToken', 'sessionId', 'iv'
      ];
      
      if (sensitiveFields.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = removeSensitiveData(value);
      }
    }
    
    return sanitized;
  }
  
  return obj;
}

/**
 * Middleware de compression des images (placeholder)
 */
export const imageOptimization = (_req: Request, _res: Response, next: NextFunction): void => {
  // Ce middleware pourrait être étendu pour optimiser les images
  // Pour l'instant, il ne fait que passer au suivant
  next();
};

/**
 * Middleware de mise en cache des requêtes de base de données
 */
export const queryCache = (ttl: number = 300) => { // 5 minutes par défaut
  const cache = new Map<string, { data: any; expiry: number }>();
  
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    // Seulement pour les requêtes GET
    if (req.method !== 'GET') {
      return next();
    }
    
    // Créer une clé de cache basée sur l'URL et les paramètres
    const cacheKey = `${req.originalUrl}:${JSON.stringify(req.query)}`;
    const cached = cache.get(cacheKey);
    
    if (cached && cached.expiry > Date.now()) {
      // Retourner les données en cache
      return res.json({
        success: true,
        data: cached.data,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Intercepter la réponse pour la mettre en cache
    const originalSend = res.send;
    res.send = function(data) {
      // Vérifier si la réponse a déjà été envoyée pour éviter la récursion
      if (res.headersSent) {
        return this;
      }
      
      // Mettre en cache seulement les réponses réussies
      if (res.statusCode === 200) {
        try {
          const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
          cache.set(cacheKey, {
            data: parsedData,
            expiry: Date.now() + (ttl * 1000)
          });
        } catch (error) {
          // Ignorer les erreurs de parsing
        }
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Middleware de nettoyage du cache
 */
export const clearCache = (_req: Request, _res: Response, next: NextFunction): void => {
  // Ce middleware pourrait être utilisé pour nettoyer le cache
  // quand des données sont modifiées
  next();
};

/**
 * Middleware de monitoring des performances de base de données
 */
export const databasePerformanceMonitor = (_req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  // Intercepter les requêtes Prisma
  const originalQuery = prisma.$queryRaw;
  (prisma as any).$queryRaw = function(...args: any[]) {
    const queryStart = Date.now();
    const result = (originalQuery as any).apply(this, args);
    
    if (result && typeof result.then === 'function') {
      return result.then((data: any) => {
        const queryTime = Date.now() - queryStart;
        
        // Logger les requêtes lentes
        if (queryTime > 1000) { // Plus d'1 seconde
          console.warn(`Requête lente détectée: ${queryTime}ms`);
        }
        
        return data;
      });
    }
    
    return result;
  };
  
  const originalSend = res.send;
  res.send = function(data) {
    // Vérifier si la réponse a déjà été envoyée pour éviter la récursion
    if (res.headersSent) {
      return this;
    }
    
    const totalTime = Date.now() - start;
    
    // Ajouter le temps de traitement à la réponse
    if (typeof data === 'object' && data !== null) {
      (data as any).processingTime = totalTime;
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware de limitation des ressources
 */
export const resourceLimiter = (maxConcurrentRequests: number = 100) => {
  let currentRequests = 0;
  
  return (_req: Request, res: Response, next: NextFunction): Response | void => {
    if (currentRequests >= maxConcurrentRequests) {
      return res.status(503).json({
        success: false,
        message: 'Serveur surchargé, veuillez réessayer plus tard'
      });
    }
    
    currentRequests++;
    
    res.on('finish', () => {
      currentRequests--;
    });
    
    res.on('close', () => {
      currentRequests--;
    });
    
    next();
  };
};
