import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

// Extension de l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        twoFactorEnabled: boolean;
      };
    }
  }
}

/**
 * Middleware d'authentification
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'accès requis'
      });
    }

    const validation = await authService.validateToken(token);

    if (!validation.valid || !validation.user) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide ou expiré'
      });
    }

    // Ajout de l'utilisateur à la requête
    req.user = validation.user;
    next();

  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * Middleware optionnel d'authentification (ne bloque pas si pas de token)
 */
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const validation = await authService.validateToken(token);
      if (validation.valid && validation.user) {
        req.user = validation.user;
      }
    }

    next();

  } catch (error) {
    console.error('Erreur dans le middleware d\'authentification optionnelle:', error);
    next(); // Continue même en cas d'erreur
  }
};
