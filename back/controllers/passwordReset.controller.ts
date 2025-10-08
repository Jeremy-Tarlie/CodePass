import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PasswordResetService } from '../services/passwordReset.service';
import { EmailService } from '../services/email.service';

const passwordResetService = new PasswordResetService();
const emailService = new EmailService();

export class PasswordResetController {
  /**
   * Demande de réinitialisation de mot de passe
   */
  static async requestPasswordReset(req: Request, res: Response): Promise<Response | void> {
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

      const { email } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const result = await passwordResetService.requestPasswordReset({
        email,
        ipAddress,
        userAgent
      });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Erreur lors de la demande de réinitialisation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Valide un token de réinitialisation (sans l'utiliser)
   */
  static async validateResetToken(req: Request, res: Response): Promise<Response | void> {
    try {
      const { token, csrf } = req.query;

      if (!token || !csrf) {
        return res.status(400).json({
          success: false,
          message: 'Token et CSRF requis'
        });
      }

      const result = await passwordResetService.validateToken(
        token as string,
        csrf as string
      );

      if (result.valid) {
        res.json({
          success: true,
          valid: true,
          email: result.email
        });
      } else {
        res.status(400).json({
          success: false,
          valid: false,
          message: result.message
        });
      }

    } catch (error) {
      console.error('Erreur lors de la validation du token:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Réinitialise le mot de passe avec un token
   */
  static async resetPassword(req: Request, res: Response): Promise<Response | void> {
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

      const { token, csrfToken, newPassword } = req.body;
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.get('User-Agent') || 'unknown';

      const result = await passwordResetService.validateAndUseResetToken({
        token,
        csrfToken,
        newPassword,
        ipAddress,
        userAgent
      });

      if (result.success) {
        res.status(200).json(result);
      } else {
        res.status(400).json(result);
      }

    } catch (error) {
      console.error('Erreur lors de la réinitialisation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Teste la configuration email
   */
  static async testEmailConfig(_req: Request, res: Response): Promise<Response | void> {
    try {
      const result = await emailService.testConnection();
      
      if (result.success) {
        res.json({
          success: true,
          message: 'Configuration email valide'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Configuration email invalide'
        });
      }

    } catch (error) {
      console.error('Erreur lors du test email:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du test de configuration email'
      });
    }
  }

  /**
   * Nettoie les tokens expirés
   */
  static async cleanupExpiredTokens(_req: Request, res: Response): Promise<Response | void> {
    try {
      await passwordResetService.cleanupExpiredTokens();
      
      res.json({
        success: true,
        message: 'Tokens expirés nettoyés avec succès'
      });

    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du nettoyage des tokens'
      });
    }
  }
}
