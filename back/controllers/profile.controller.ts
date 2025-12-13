import { Request, Response } from 'express';
import { EncryptionService } from '../services/encryption.service';
import { EmailService } from '../services/email.service';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';

const prisma = new PrismaClient();
const encryptionService = new EncryptionService();
const emailService = new EmailService();

export class ProfileController {
  /**
   * Récupérer les informations du profil
   */
  static async getProfile(req: Request, res: Response): Promise<Response | void> {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Non authentifié'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          backupEmail: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        user
      });

    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Modifier l'email
   */
  static async updateEmail(req: Request, res: Response): Promise<Response | void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const userId = (req as any).user?.id;
      const { newEmail, currentPassword } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Non authentifié'
        });
      }

      // Récupérer l'utilisateur actuel
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier le mot de passe actuel
      const isPasswordValid = await encryptionService.verifyPassword(currentPassword, user.password);
      if (!isPasswordValid) {
        await prisma.securityLog.create({
          data: {
            userId,
            action: 'EMAIL_UPDATE_FAILED',
            ipAddress,
            userAgent,
            success: false,
            details: 'Mot de passe incorrect'
          }
        });
        
        return res.status(401).json({
          success: false,
          message: 'Mot de passe incorrect'
        });
      }

      // Vérifier si le nouvel email est déjà utilisé
      const emailExists = await prisma.user.findUnique({
        where: { email: newEmail.toLowerCase() }
      });

      if (emailExists && emailExists.id !== userId) {
        return res.status(409).json({
          success: false,
          message: 'Cet email est déjà utilisé par un autre compte'
        });
      }

      const oldEmail = user.email;

      // Mettre à jour l'email
      await prisma.user.update({
        where: { id: userId },
        data: { email: newEmail.toLowerCase() }
      });

      // Log de sécurité
      await prisma.securityLog.create({
        data: {
          userId,
          action: 'EMAIL_UPDATED',
          ipAddress,
          userAgent,
          success: true,
          details: `Email modifié de ${oldEmail} vers ${newEmail.toLowerCase()}`
        }
      });

      // Envoyer un email de confirmation à l'ancien email
      await emailService.sendEmailChangeNotification(oldEmail, newEmail.toLowerCase());
      
      // Envoyer aussi une notification au nouvel email
      await emailService.sendEmailChangeConfirmation(newEmail.toLowerCase());

      // Envoyer aussi à l'email de secours si défini
      if (user.backupEmail) {
        await emailService.sendEmailChangeNotification(user.backupEmail, newEmail.toLowerCase());
      }

      res.json({
        success: true,
        message: 'Email mis à jour avec succès. Un email de confirmation a été envoyé.'
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'email:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Modifier le mot de passe
   */
  static async updatePassword(req: Request, res: Response): Promise<Response | void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const userId = (req as any).user?.id;
      const { currentPassword, newPassword } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Non authentifié'
        });
      }

      // Récupérer l'utilisateur actuel
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier le mot de passe actuel
      const isPasswordValid = await encryptionService.verifyPassword(currentPassword, user.password);
      if (!isPasswordValid) {
        await prisma.securityLog.create({
          data: {
            userId,
            action: 'PASSWORD_UPDATE_FAILED',
            ipAddress,
            userAgent,
            success: false,
            details: 'Mot de passe actuel incorrect'
          }
        });
        
        return res.status(401).json({
          success: false,
          message: 'Mot de passe actuel incorrect'
        });
      }

      // Hacher le nouveau mot de passe
      const hashedPassword = await encryptionService.hashPassword(newPassword);

      // Mettre à jour le mot de passe
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
      });

      // Log de sécurité
      await prisma.securityLog.create({
        data: {
          userId,
          action: 'PASSWORD_UPDATED',
          ipAddress,
          userAgent,
          success: true,
          details: 'Mot de passe modifié avec succès'
        }
      });

      // Envoyer un email de confirmation
      await emailService.sendPasswordChangeNotification(user.email);

      // Envoyer aussi à l'email de secours si défini
      if (user.backupEmail) {
        await emailService.sendPasswordChangeNotification(user.backupEmail);
      }

      res.json({
        success: true,
        message: 'Mot de passe mis à jour avec succès. Un email de confirmation a été envoyé.'
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
   * Modifier l'email de secours
   */
  static async updateBackupEmail(req: Request, res: Response): Promise<Response | void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const userId = (req as any).user?.id;
      const { backupEmail, currentPassword } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Non authentifié'
        });
      }

      // Récupérer l'utilisateur actuel
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Vérifier le mot de passe actuel
      const isPasswordValid = await encryptionService.verifyPassword(currentPassword, user.password);
      if (!isPasswordValid) {
        await prisma.securityLog.create({
          data: {
            userId,
            action: 'BACKUP_EMAIL_UPDATE_FAILED',
            ipAddress,
            userAgent,
            success: false,
            details: 'Mot de passe incorrect'
          }
        });
        
        return res.status(401).json({
          success: false,
          message: 'Mot de passe incorrect'
        });
      }

      // Vérifier que l'email de secours n'est pas le même que l'email principal
      if (backupEmail && backupEmail.toLowerCase() === user.email) {
        return res.status(400).json({
          success: false,
          message: 'L\'email de secours ne peut pas être identique à l\'email principal'
        });
      }

      const oldBackupEmail = user.backupEmail;

      // Mettre à jour l'email de secours
      await prisma.user.update({
        where: { id: userId },
        data: { backupEmail: backupEmail ? backupEmail.toLowerCase() : null }
      });

      // Log de sécurité
      await prisma.securityLog.create({
        data: {
          userId,
          action: 'BACKUP_EMAIL_UPDATED',
          ipAddress,
          userAgent,
          success: true,
          details: backupEmail 
            ? `Email de secours modifié vers ${backupEmail.toLowerCase()}` 
            : 'Email de secours supprimé'
        }
      });

      // Envoyer une notification à l'email principal
      await emailService.sendBackupEmailChangeNotification(user.email, backupEmail?.toLowerCase() || null);

      // Si un nouvel email de secours est défini, lui envoyer une confirmation
      if (backupEmail) {
        await emailService.sendBackupEmailConfirmation(backupEmail.toLowerCase());
      }

      // Notifier l'ancien email de secours si défini
      if (oldBackupEmail && oldBackupEmail !== backupEmail?.toLowerCase()) {
        await emailService.sendBackupEmailRemovedNotification(oldBackupEmail);
      }

      res.json({
        success: true,
        message: backupEmail 
          ? 'Email de secours mis à jour avec succès. Un email de confirmation a été envoyé.'
          : 'Email de secours supprimé avec succès.'
      });

    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'email de secours:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Règles de validation pour la modification d'email
   */
  static getUpdateEmailValidationRules() {
    return [
      body('newEmail')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email invalide'),
      body('currentPassword')
        .notEmpty()
        .withMessage('Le mot de passe actuel est requis')
    ];
  }

  /**
   * Règles de validation pour la modification de mot de passe
   */
  static getUpdatePasswordValidationRules() {
    return [
      body('currentPassword')
        .notEmpty()
        .withMessage('Le mot de passe actuel est requis'),
      body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Le nouveau mot de passe doit contenir au moins 8 caractères')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])/)
        .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial')
    ];
  }

  /**
   * Règles de validation pour la modification d'email de secours
   */
  static getUpdateBackupEmailValidationRules() {
    return [
      body('backupEmail')
        .optional({ nullable: true })
        .isEmail()
        .normalizeEmail()
        .withMessage('Email de secours invalide'),
      body('currentPassword')
        .notEmpty()
        .withMessage('Le mot de passe actuel est requis')
    ];
  }
}



