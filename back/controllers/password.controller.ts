import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from '../services/encryption.service';
import { body, validationResult } from 'express-validator';

const prisma = new PrismaClient();
const encryptionService = new EncryptionService();

export class PasswordController {
  /**
   * Récupère tous les mots de passe de l'utilisateur
   */
  static async getAllPasswords(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = (req as any).user.id;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      // Récupération de l'utilisateur avec sa clé de chiffrement
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { encryptionKey: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Récupération des entrées de mots de passe avec les données chiffrées
      const passwordEntries = await prisma.passwordEntry.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          url: true,
          encryptedData: true,
          iv: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      // Déchiffrement des données pour chaque entrée
      const passwordsWithDecryptedData = passwordEntries.map(entry => {
        try {
          const decryptedData = encryptionService.decryptObject(
            entry.encryptedData,
            user.encryptionKey,
            entry.iv
          );
          
          return {
            id: entry.id,
            title: entry.title,
            url: entry.url,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            ...(decryptedData as any)
          };
        } catch (error) {
          console.error(`Erreur lors du déchiffrement de l'entrée ${entry.id}:`, error);
          // Retourner l'entrée sans les données déchiffrées en cas d'erreur
          return {
            id: entry.id,
            title: entry.title,
            url: entry.url,
            createdAt: entry.createdAt,
            updatedAt: entry.updatedAt,
            username: '',
            password: '',
            notes: ''
          };
        }
      });

      // Log de sécurité
      await prisma.securityLog.create({
        data: {
          userId,
          action: 'PASSWORDS_VIEWED',
          ipAddress,
          userAgent,
          success: true,
          details: `${passwordEntries.length} mots de passe consultés`
        }
      });

      res.json({
        success: true,
        passwords: passwordsWithDecryptedData
      });

    } catch (error) {
      console.error('Erreur lors de la récupération des mots de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Récupère un mot de passe spécifique
   */
  static async getPassword(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      // Récupération de l'entrée de mot de passe
      const passwordEntry = await prisma.passwordEntry.findFirst({
        where: {
          id: id as string,
          userId
        }
      });

      if (!passwordEntry) {
        return res.status(404).json({
          success: false,
          message: 'Mot de passe non trouvé'
        });
      }

      // Récupération de l'utilisateur avec sa clé de chiffrement
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { encryptionKey: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Déchiffrement des données
      const decryptedData = encryptionService.decryptObject(
        passwordEntry.encryptedData,
        user.encryptionKey,
        passwordEntry.iv
      );

      // Log de sécurité
      await prisma.securityLog.create({
        data: {
          userId,
          action: 'PASSWORD_VIEWED',
          ipAddress,
          userAgent,
          success: true,
          details: `Mot de passe consulté: ${passwordEntry.title}`
        }
      });

      res.json({
        success: true,
        password: {
          id: passwordEntry.id,
          title: passwordEntry.title,
          url: passwordEntry.url,
          createdAt: passwordEntry.createdAt,
          updatedAt: passwordEntry.updatedAt,
          ...(decryptedData as any)
        }
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Crée un nouveau mot de passe
   */
  static async createPassword(req: Request, res: Response): Promise<Response | void> {
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

      const userId = (req as any).user.id;
      const { title, url, username, password, notes } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      // Récupération de l'utilisateur avec sa clé de chiffrement
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { encryptionKey: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Chiffrement des données sensibles
      const dataToEncrypt = {
        username: username || '',
        password: password || '',
        notes: notes || ''
      };

      const encryptionResult = encryptionService.encryptObject(
        dataToEncrypt,
        user.encryptionKey
      );

      // Création de l'entrée de mot de passe
      const passwordEntry = await prisma.passwordEntry.create({
        data: {
          title,
          url: url || null,
          encryptedData: encryptionResult.encrypted,
          iv: encryptionResult.iv,
          userId
        },
        select: {
          id: true,
          title: true,
          url: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Log de sécurité
      await prisma.securityLog.create({
        data: {
          userId,
          action: 'PASSWORD_CREATED',
          ipAddress,
          userAgent,
          success: true,
          details: `Nouveau mot de passe créé: ${title}`
        }
      });

      res.status(201).json({
        success: true,
        message: 'Mot de passe créé avec succès',
        password: passwordEntry
      });

    } catch (error) {
      console.error('Erreur lors de la création du mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Met à jour un mot de passe
   */
  static async updatePassword(req: Request, res: Response): Promise<Response | void> {
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

      const userId = (req as any).user.id;
      const { id } = req.params;
      const { title, url, username, password, notes } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      // Vérification que le mot de passe appartient à l'utilisateur
      const existingEntry = await prisma.passwordEntry.findFirst({
        where: {
          id: id as string,
          userId
        }
      });

      if (!existingEntry) {
        return res.status(404).json({
          success: false,
          message: 'Mot de passe non trouvé'
        });
      }

      // Récupération de l'utilisateur avec sa clé de chiffrement
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { encryptionKey: true }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Chiffrement des nouvelles données
      const dataToEncrypt = {
        username: username || '',
        password: password || '',
        notes: notes || ''
      };

      const encryptionResult = encryptionService.encryptObject(
        dataToEncrypt,
        user.encryptionKey
      );

      // Mise à jour de l'entrée
      const updatedEntry = await prisma.passwordEntry.update({
        where: { id: id as string },
        data: {
          title,
          url: url || null,
          encryptedData: encryptionResult.encrypted,
          iv: encryptionResult.iv
        },
        select: {
          id: true,
          title: true,
          url: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Log de sécurité
      await prisma.securityLog.create({
        data: {
          userId,
          action: 'PASSWORD_UPDATED',
          ipAddress,
          userAgent,
          success: true,
          details: `Mot de passe mis à jour: ${title}`
        }
      });

      res.json({
        success: true,
        message: 'Mot de passe mis à jour avec succès',
        password: updatedEntry
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Supprime un mot de passe
   */
  static async deletePassword(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      // Vérification que le mot de passe appartient à l'utilisateur
      const existingEntry = await prisma.passwordEntry.findFirst({
        where: {
          id: id as string,
          userId
        }
      });

      if (!existingEntry) {
        return res.status(404).json({
          success: false,
          message: 'Mot de passe non trouvé'
        });
      }

      // Suppression de l'entrée
      await prisma.passwordEntry.delete({
        where: { id: id as string }
      });

      // Log de sécurité
      await prisma.securityLog.create({
        data: {
          userId,
          action: 'PASSWORD_DELETED',
          ipAddress,
          userAgent,
          success: true,
          details: `Mot de passe supprimé: ${existingEntry.title}`
        }
      });

      res.json({
        success: true,
        message: 'Mot de passe supprimé avec succès'
      });

    } catch (error) {
      console.error('Erreur lors de la suppression du mot de passe:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Règles de validation pour la création/mise à jour de mots de passe
   */
  static getPasswordValidationRules() {
    return [
      body('title')
        .notEmpty()
        .withMessage('Le titre est requis')
        .isLength({ max: 100 })
        .withMessage('Le titre ne peut pas dépasser 100 caractères'),
      body('url')
        .optional()
        .isURL()
        .withMessage('URL invalide')
    ];
  }
}