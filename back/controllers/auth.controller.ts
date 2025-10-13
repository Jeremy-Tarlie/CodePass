import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { EncryptionService } from '../services/encryption.service';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';

const prisma = new PrismaClient();
const authService = new AuthService();
const encryptionService = new EncryptionService();

export class AuthController {
  /**
   * Inscription d'un nouvel utilisateur
   */
  static async register(req: Request, res: Response): Promise<Response | void> {
    try {
      // Validation des erreurs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      // Vérification si l'utilisateur existe déjà
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Un utilisateur avec cet email existe déjà'
        });
      }

      // Validation du mot de passe
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Le mot de passe doit contenir au moins 8 caractères'
        });
      }

      // Hachage du mot de passe
      const hashedPassword = await encryptionService.hashPassword(password);
      
      // Génération d'une clé de chiffrement unique
      const encryptionKey = encryptionService.generateKey();

      // Création de l'utilisateur
      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          encryptionKey
        },
        select: {
          id: true,
          email: true,
          createdAt: true
        }
      });

      // Log de sécurité
      await prisma.securityLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          ipAddress,
          userAgent,
          success: true,
          details: 'Nouvel utilisateur créé'
        }
      });

      res.status(201).json({
        success: true,
        message: 'Utilisateur créé avec succès',
        user
      });

    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  static async login(req: Request, res: Response): Promise<Response | void> {
    try {
      // Validation des erreurs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { email, password, rememberMe } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const result = await authService.login(email, password, ipAddress, userAgent, rememberMe);

      if (result.success) {
        res.json({
          success: true,
          message: 'Connexion réussie',
          token: result.token,
          user: result.user
        });
      } else {
        res.status(401).json({
          success: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Déconnexion d'un utilisateur
   */
  static async logout(req: Request, res: Response): Promise<Response | void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token manquant'
        });
      }

      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const success = await authService.logout(token, ipAddress, userAgent);

      if (success) {
        res.json({
          success: true,
          message: 'Déconnexion réussie'
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Token invalide'
        });
      }

    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Vérification du token
   */
  static async verifyToken(req: Request, res: Response): Promise<Response | void> {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token manquant'
        });
      }

      const validation = await authService.validateToken(token);

      if (validation.valid) {
        res.json({
          success: true,
          message: 'Token valide',
          user: validation.user
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Token invalide ou expiré'
        });
      }

    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Règles de validation pour l'inscription
   */
  static getRegisterValidationRules() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email invalide'),
      body('password')
        .isLength({ min: 8 })
        .withMessage('Le mot de passe doit contenir au moins 8 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])/)
        .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial')
    ];
  }

  /**
   * Règles de validation pour la connexion
   */
  static getLoginValidationRules() {
    return [
      body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email invalide'),
      body('password')
        .notEmpty()
        .withMessage('Le mot de passe est requis')
    ];
  }
}
