import { Request, Response } from 'express';
import { generateApiKey } from '../middleware/apiKey.middleware';

export class ApiKeyController {
  /**
   * Génère une nouvelle clé API (pour l'administration)
   */
  static generateNewApiKey(_req: Request, res: Response): Response | void {
    try {
      // Vérifier si l'utilisateur a les droits d'administration
      // (vous pouvez ajouter une vérification d'authentification ici)
      
      const newApiKey = generateApiKey();
      
      res.json({
        success: true,
        message: 'Nouvelle clé API générée',
        apiKey: newApiKey,
        warning: 'IMPORTANT: Sauvegardez cette clé immédiatement. Elle ne sera plus affichée.',
        instructions: {
          frontend: 'Ajoutez cette clé dans votre fichier .env comme API_KEY',
          backend: 'Ajoutez cette clé dans votre fichier .env comme API_KEY',
          usage: 'Utilisez cette clé dans le header X-API-Key de vos requêtes'
        }
      });
    } catch (error) {
      console.error('Erreur lors de la génération de la clé API:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération de la clé API'
      });
    }
  }

  /**
   * Vérifie si une clé API est valide
   */
  static validateApiKey(req: Request, res: Response): Response | void {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      
      if (!apiKey) {
        return res.status(400).json({
          success: false,
          message: 'Clé API manquante dans le header X-API-Key'
        });
      }

      const validApiKey = process.env.API_KEY;
      
      if (!validApiKey) {
        return res.status(500).json({
          success: false,
          message: 'Configuration serveur invalide'
        });
      }

      // Comparaison sécurisée
      const crypto = require('crypto');
      const isValid = crypto.timingSafeEqual(
        Buffer.from(apiKey, 'utf8'),
        Buffer.from(validApiKey, 'utf8')
      );

      if (isValid) {
        res.json({
          success: true,
          message: 'Clé API valide',
          keyInfo: {
            prefix: apiKey.substring(0, 8),
            length: apiKey.length,
            validatedAt: new Date().toISOString()
          }
        });
      } else {
        res.status(403).json({
          success: false,
          message: 'Clé API invalide'
        });
      }
    } catch (error) {
      console.error('Erreur lors de la validation de la clé API:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Obtient des informations sur la configuration de l'API
   */
  static getApiInfo(_req: Request, res: Response): Response | void {
    try {
      const hasApiKey = !!process.env.API_KEY;
      const hasSecondaryKey = !!process.env.API_KEY_SECONDARY;
      
      res.json({
        success: true,
        apiInfo: {
          hasApiKey,
          hasSecondaryKey,
          keyRotationEnabled: hasSecondaryKey,
          endpoints: {
            auth: '/api/auth/*',
            passwords: '/api/passwords/*'
          },
          headers: {
            required: 'X-API-Key',
            description: 'Clé API pour l\'authentification'
          },
          security: {
            timingSafeComparison: true,
            keyMasking: true,
            accessLogging: true
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors de la récupération des informations API:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}
