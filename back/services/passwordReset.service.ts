import crypto from 'crypto';
import { prisma } from '../db';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';

const authService = new AuthService();
const emailService = new EmailService();

export interface PasswordResetRequest {
  email: string;
  ipAddress: string;
  userAgent: string;
}

export interface PasswordResetValidation {
  token: string;
  csrfToken: string;
  newPassword: string;
  ipAddress: string;
  userAgent: string;
}

export class PasswordResetService {
  private readonly tokenExpirationMinutes = 15; // 15 minutes
  private readonly maxAttemptsPerHour = 3; // Maximum 3 tentatives par heure

  /**
   * Demande de réinitialisation de mot de passe
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<{ success: boolean; message: string }> {
    try {
      const { email, ipAddress, userAgent } = request;

      // Vérifier si l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        // Ne pas révéler si l'email existe ou non (sécurité)
        return {
          success: true,
          message: 'Si cet email existe dans notre système, vous recevrez un email de réinitialisation.'
        };
      }

      // Vérifier le taux de tentatives (rate limiting)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentAttempts = await prisma.passwordResetToken.count({
        where: {
          email: email.toLowerCase(),
          createdAt: {
            gte: oneHourAgo
          }
        }
      });

      if (recentAttempts >= this.maxAttemptsPerHour) {
        await this.logSecurityEvent(
          user.id,
          'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
          ipAddress,
          userAgent,
          false,
          `Trop de tentatives de réinitialisation pour ${email}`
        );

        return {
          success: false,
          message: 'Trop de tentatives de réinitialisation. Veuillez réessayer dans une heure.'
        };
      }

      // Invalider tous les tokens existants pour cet utilisateur
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          used: false
        },
        data: {
          used: true,
          usedAt: new Date()
        }
      });

      // Générer un token sécurisé
      const resetToken = this.generateSecureToken();
      const csrfToken = this.generateSecureToken();
      const expiresAt = new Date(Date.now() + this.tokenExpirationMinutes * 60 * 1000);

      // Créer le token de réinitialisation
      await prisma.passwordResetToken.create({
        data: {
          token: resetToken,
          csrfToken: csrfToken,
          userId: user.id,
          email: user.email,
          expiresAt: expiresAt,
          ipAddress: ipAddress,
          userAgent: userAgent
        }
      });

      // Envoyer l'email de réinitialisation
      await emailService.sendPasswordResetEmail(user.email, resetToken, csrfToken);

      // Log de sécurité
      await this.logSecurityEvent(
        user.id,
        'PASSWORD_RESET_REQUESTED',
        ipAddress,
        userAgent,
        true,
        `Demande de réinitialisation envoyée à ${user.email}`
      );

      return {
        success: true,
        message: 'Si cet email existe dans notre système, vous recevrez un email de réinitialisation.'
      };

    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur. Veuillez réessayer plus tard.'
      };
    }
  }

  /**
   * Valide et utilise un token de réinitialisation
   */
  async validateAndUseResetToken(validation: PasswordResetValidation): Promise<{ success: boolean; message: string }> {
    try {
      const { token, csrfToken, newPassword, ipAddress, userAgent } = validation;

      // Trouver le token
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!resetToken) {
        return {
          success: false,
          message: 'Token de réinitialisation invalide ou expiré.'
        };
      }

      // Vérifier si le token est expiré
      if (resetToken.expiresAt < new Date()) {
        await this.logSecurityEvent(
          resetToken.userId,
          'PASSWORD_RESET_TOKEN_EXPIRED',
          ipAddress,
          userAgent,
          false,
          `Tentative d'utilisation d'un token expiré`
        );

        return {
          success: false,
          message: 'Token de réinitialisation expiré. Veuillez faire une nouvelle demande.'
        };
      }

      // Vérifier si le token a déjà été utilisé
      if (resetToken.used) {
        await this.logSecurityEvent(
          resetToken.userId,
          'PASSWORD_RESET_TOKEN_ALREADY_USED',
          ipAddress,
          userAgent,
          false,
          `Tentative d'utilisation d'un token déjà utilisé`
        );

        return {
          success: false,
          message: 'Token de réinitialisation déjà utilisé. Veuillez faire une nouvelle demande.'
        };
      }

      // Vérifier le token CSRF
      if (resetToken.csrfToken !== csrfToken) {
        await this.logSecurityEvent(
          resetToken.userId,
          'PASSWORD_RESET_CSRF_TOKEN_INVALID',
          ipAddress,
          userAgent,
          false,
          `Token CSRF invalide pour la réinitialisation`
        );

        return {
          success: false,
          message: 'Token de sécurité invalide.'
        };
      }

      // Valider le nouveau mot de passe
      if (!this.isValidPassword(newPassword)) {
        return {
          success: false,
          message: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
        };
      }

      // Hacher le nouveau mot de passe
      const hashedPassword = await authService.hashPassword(newPassword);

      // Mettre à jour le mot de passe de l'utilisateur
      await prisma.user.update({
        where: { id: resetToken.userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
          passwordChangedAt: new Date()
        }
      });

      // Marquer le token comme utilisé
      await prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: {
          used: true,
          usedAt: new Date()
        }
      });

      // Invalider toutes les sessions existantes de l'utilisateur
      await prisma.userSession.deleteMany({
        where: { userId: resetToken.userId }
      });

      // Log de sécurité
      await this.logSecurityEvent(
        resetToken.userId,
        'PASSWORD_RESET_SUCCESS',
        ipAddress,
        userAgent,
        true,
        `Mot de passe réinitialisé avec succès pour ${resetToken.email}`
      );

      return {
        success: true,
        message: 'Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.'
      };

    } catch (error) {
      console.error('Erreur lors de la validation du token:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur. Veuillez réessayer plus tard.'
      };
    }
  }

  /**
   * Vérifie la validité d'un token (sans l'utiliser)
   */
  async validateToken(token: string, csrfToken: string): Promise<{ valid: boolean; email?: string; message?: string }> {
    try {
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true }
      });

      if (!resetToken) {
        return { valid: false, message: 'Token invalide' };
      }

      if (resetToken.expiresAt < new Date()) {
        return { valid: false, message: 'Token expiré' };
      }

      if (resetToken.used) {
        return { valid: false, message: 'Token déjà utilisé' };
      }

      if (resetToken.csrfToken !== csrfToken) {
        return { valid: false, message: 'Token CSRF invalide' };
      }

      return { valid: true, email: resetToken.email };

    } catch (error) {
      console.error('Erreur lors de la validation du token:', error);
      return { valid: false, message: 'Erreur de validation' };
    }
  }

  /**
   * Nettoie les tokens expirés
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      await prisma.passwordResetToken.deleteMany({
        where: {
          OR: [
            { expiresAt: { lt: new Date() } },
            { used: true, usedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Supprimer les tokens utilisés depuis plus de 24h
          ]
        }
      });
    } catch (error) {
      console.error('Erreur lors du nettoyage des tokens:', error);
    }
  }

  /**
   * Génère un token sécurisé
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Valide un mot de passe
   */
  private isValidPassword(password: string): boolean {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]{8,}$/;
    return passwordRegex.test(password);
  }


  /**
   * Enregistre un événement de sécurité
   */
  private async logSecurityEvent(
    userId: string,
    action: string,
    ipAddress: string,
    userAgent: string,
    success: boolean,
    details?: string
  ): Promise<void> {
    try {
      await prisma.securityLog.create({
        data: {
          userId,
          action,
          ipAddress,
          userAgent,
          success,
          details: details || null
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du log de sécurité:', error);
    }
  }
}
