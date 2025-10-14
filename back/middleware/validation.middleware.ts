import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Middleware de validation des erreurs
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): Response | void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    const firstError = errorMessages[0];
    
    return res.status(400).json({
      success: false,
      message: firstError || 'Données invalides',
      errors: errors.array().map(error => ({
        field: error.type === 'field' ? (error as any).path : 'unknown',
        message: error.msg,
        value: error.type === 'field' ? (error as any).value : undefined
      }))
    });
  }
  
  next();
};

/**
 * Middleware de sanitisation des données
 */
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction): void => {
  // Fonction de nettoyage des chaînes
  const sanitizeString = (str: string): string => {
    if (typeof str !== 'string') return str;
    
    return str
      .trim() // Supprimer les espaces en début/fin
      .replace(/[<>]/g, '') // Supprimer les balises HTML
      .replace(/javascript:/gi, '') // Supprimer les scripts JavaScript
      .replace(/on\w+=/gi, '') // Supprimer les événements JavaScript
      .substring(0, 1000); // Limiter la longueur
  };

  // Nettoyage récursif des objets
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Sanitisation du body, query et params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

/**
 * Middleware de validation des types de contenu
 */
export const validateContentType = (req: Request, res: Response, next: NextFunction): Response | void => {
  const contentType = req.get('Content-Type');
  
  // Pour les requêtes POST/PUT/PATCH, vérifier le Content-Type
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(415).json({
        success: false,
        message: 'Content-Type doit être application/json'
      });
    }
  }
  
  next();
};

/**
 * Middleware de validation de la taille des données
 */
export const validateDataSize = (maxSize: number = 1024 * 1024) => { // 1MB par défaut
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const contentLength = parseInt(req.get('Content-Length') || '0');
    
    if (contentLength > maxSize) {
      return res.status(413).json({
        success: false,
        message: `Taille des données trop importante. Maximum autorisé: ${maxSize} bytes`
      });
    }
    
    next();
  };
};

/**
 * Middleware de validation des paramètres d'URL
 */
export const validateUrlParams = (req: Request, res: Response, next: NextFunction): Response | void => {
  const { id } = req.params;
  
  // Validation de l'ID (doit être un CUID valide)
  if (id && !/^c[a-z0-9]{24}$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: 'ID invalide'
    });
  }
  
  next();
};

/**
 * Middleware de validation des emails uniques
 */
export const validateUniqueEmail = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const { email } = req.body;
  
  if (email) {
    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      
      if (existingUser && req.method === 'POST') {
        return res.status(409).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la validation de l\'email:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
  
  next();
};

/**
 * Middleware de validation des mots de passe forts
 */
export const validateStrongPassword = (req: Request, res: Response, next: NextFunction): Response | void => {
  const { password } = req.body;
  
  if (password) {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]{8,}$/;
    
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères, une minuscule, une majuscule, un chiffre et un caractère spécial (!@#$%^&*()_+-=[]{}|;:,.<>?/~`)'
      });
    }
    
    // Vérification des mots de passe communs
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];
    
    if (commonPasswords.includes(password.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Ce mot de passe est trop commun, veuillez en choisir un plus sécurisé'
      });
    }
  }
  
  next();
};

/**
 * Middleware de validation des URLs
 */
export const validateUrl = (req: Request, res: Response, next: NextFunction): Response | void => {
  const { url } = req.body;
  
  if (url && url.trim() !== '') {
    try {
      const urlObj = new URL(url);
      
      // Vérifier que c'est HTTPS en production
      if (process.env.NODE_ENV === 'production' && urlObj.protocol !== 'https:') {
        return res.status(400).json({
          success: false,
          message: 'Seules les URLs HTTPS sont autorisées en production'
        });
      }
      
      // Vérifier que ce n'est pas une URL locale ou privée
      if (urlObj.hostname === 'localhost' || 
          urlObj.hostname.startsWith('127.') || 
          urlObj.hostname.startsWith('192.168.') ||
          urlObj.hostname.startsWith('10.')) {
        return res.status(400).json({
          success: false,
          message: 'Les URLs locales ne sont pas autorisées'
        });
      }
      
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'URL invalide'
      });
    }
  }
  
  next();
};

/**
 * Middleware de validation des catégories
 */
export const validateCategory = (req: Request, res: Response, next: NextFunction): Response | void => {
  const { category } = req.body;
  
  if (category) {
    const allowedCategories = [
      'General', 'Email', 'Social Media', 'Banking', 'Shopping',
      'Work', 'Personal', 'Gaming', 'Streaming', 'Other'
    ];
    
    if (!allowedCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Catégorie invalide. Catégories autorisées: ${allowedCategories.join(', ')}`
      });
    }
  }
  
  next();
};

/**
 * Middleware de validation des limites de ressources
 */
export const validateResourceLimits = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  const userId = (req as any).user?.id;
  
  if (userId && req.method === 'POST' && req.path.includes('/passwords')) {
    try {
      const passwordCount = await prisma.passwordEntry.count({
        where: { userId }
      });
      
      const maxPasswords = parseInt(process.env.MAX_PASSWORDS_PER_USER || '1000');
      
      if (passwordCount >= maxPasswords) {
        return res.status(429).json({
          success: false,
          message: `Limite de ${maxPasswords} mots de passe atteinte`
        });
      }
    } catch (error) {
      console.error('Erreur lors de la validation des limites:', error);
    }
  }
  
  next();
};