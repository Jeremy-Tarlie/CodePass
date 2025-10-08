import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { EncryptionService } from './encryption.service';

const prisma = new PrismaClient();
const encryptionService = new EncryptionService();

export interface JWTPayload {
  userId: string;
  email: string;
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    twoFactorEnabled: boolean;
  };
  message?: string;
}

export class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtExpiresIn: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  /**
   * Hache un mot de passe
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Vérifie un mot de passe
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Génère un token JWT
   */
  generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'gestionnaire-mdp',
      audience: 'gestionnaire-mdp-client'
    } as jwt.SignOptions);
  }

  /**
   * Vérifie et décode un token JWT
   */
  verifyToken(token: string): JWTPayload | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret, {
        issuer: 'gestionnaire-mdp',
        audience: 'gestionnaire-mdp-client'
      }) as JWTPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Authentifie un utilisateur
   */
  async login(email: string, password: string, ipAddress: string, userAgent: string, rememberMe: boolean = false): Promise<LoginResult> {
    try {
      // Recherche de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });

      if (!user) {
        await this.logSecurityEvent(null, 'LOGIN_ATTEMPT', ipAddress, userAgent, false, 'Utilisateur non trouvé');
        return {
          success: false,
          message: 'Email ou mot de passe incorrect'
        };
      }

      // Vérification du mot de passe
      const isPasswordValid = await encryptionService.verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        await this.logSecurityEvent(user.id, 'LOGIN_ATTEMPT', ipAddress, userAgent, false, 'Mot de passe incorrect');
        return {
          success: false,
          message: 'Email ou mot de passe incorrect'
        };
      }

      // Création d'une session avec durée variable selon "rester connecté"
      const sessionId = encryptionService.generateSecureToken();
      const sessionExpiresAt = new Date();
      
      if (rememberMe) {
        // Si "rester connecté" : 30 jours
        sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 30);
      } else {
        // Sinon : 7 jours (comportement actuel)
        sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);
      }

      await prisma.userSession.create({
        data: {
          token: sessionId,
          userId: user.id,
          ipAddress,
          userAgent,
          expiresAt: sessionExpiresAt,
          rememberMe
        }
      });

      // Mise à jour de la dernière connexion
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      // Génération du token JWT avec durée variable
      const tokenExpiresIn = rememberMe ? '30d' : '24h';
      const token = jwt.sign({
        userId: user.id,
        email: user.email,
        sessionId
      }, this.jwtSecret, {
        expiresIn: tokenExpiresIn,
        issuer: 'gestionnaire-mdp',
        audience: 'gestionnaire-mdp-client'
      });

      await this.logSecurityEvent(user.id, 'LOGIN_SUCCESS', ipAddress, userAgent, true, 'Connexion réussie');

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          twoFactorEnabled: user.twoFactorEnabled
        }
      };

    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  /**
   * Déconnecte un utilisateur
   */
  async logout(token: string, ipAddress: string, userAgent: string): Promise<boolean> {
    try {
      const payload = this.verifyToken(token);
      if (!payload) {
        return false;
      }

      // Suppression de la session
      await prisma.userSession.deleteMany({
        where: {
          token: payload.sessionId,
          userId: payload.userId
        }
      });

      await this.logSecurityEvent(payload.userId, 'LOGOUT', ipAddress, userAgent, true, 'Déconnexion réussie');
      return true;

    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return false;
    }
  }

  /**
   * Vérifie si un token est valide
   */
  async validateToken(token: string): Promise<{ valid: boolean; user?: any }> {
    try {
      const payload = this.verifyToken(token);
      if (!payload) {
        return { valid: false };
      }

      // Vérification de la session en base
      const session = await prisma.userSession.findFirst({
        where: {
          token: payload.sessionId,
          userId: payload.userId,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              twoFactorEnabled: true
            }
          }
        }
      });

      if (!session) {
        return { valid: false };
      }

      return {
        valid: true,
        user: session.user
      };

    } catch (error) {
      return { valid: false };
    }
  }

  /**
   * Enregistre un événement de sécurité
   */
  private async logSecurityEvent(
    userId: string | null,
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

  /**
   * Nettoie les sessions expirées
   */
  async cleanupExpiredSessions(): Promise<void> {
    try {
      await prisma.userSession.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });
    } catch (error) {
      console.error('Erreur lors du nettoyage des sessions:', error);
    }
  }
}
