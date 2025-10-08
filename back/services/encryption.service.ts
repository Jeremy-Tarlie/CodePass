import crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits

  /**
   * Génère une clé de chiffrement aléatoire
   */
  generateKey(): string {
    return crypto.randomBytes(this.keyLength).toString('hex');
  }

  /**
   * Génère un vecteur d'initialisation aléatoire
   */
  generateIV(): string {
    return crypto.randomBytes(this.ivLength).toString('hex');
  }

  /**
   * Chiffre les données avec une clé et un IV
   */
  encrypt(data: string, key: string, iv?: string): { encrypted: string; iv: string } {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const ivBuffer = iv ? Buffer.from(iv, 'hex') : crypto.randomBytes(this.ivLength);
      
      const cipher = crypto.createCipheriv(this.algorithm, keyBuffer, ivBuffer);
      
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Récupérer le tag d'authentification pour GCM
      const authTag = cipher.getAuthTag();
      
      // Combiner les données chiffrées avec le tag d'authentification
      const result = encrypted + ':' + authTag.toString('hex');
      
      return {
        encrypted: result,
        iv: ivBuffer.toString('hex')
      };
    } catch (error) {
      throw new Error(`Erreur de chiffrement: ${error}`);
    }
  }

  /**
   * Déchiffre les données avec une clé et un IV
   */
  decrypt(encryptedData: string, key: string, iv: string): string {
    try {
      const keyBuffer = Buffer.from(key, 'hex');
      const ivBuffer = Buffer.from(iv, 'hex');
      
      // Séparer les données chiffrées du tag d'authentification
      const parts = encryptedData.split(':');
      if (parts.length !== 2) {
        throw new Error('Format de données chiffrées invalide');
      }
      
      const [encrypted, authTagHex] = parts as [string, string];
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = crypto.createDecipheriv(this.algorithm, keyBuffer, ivBuffer);
      
      // Définir le tag d'authentification
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Erreur de déchiffrement: ${error}`);
    }
  }

  /**
   * Chiffre un objet JSON
   */
  encryptObject(obj: any, key: string, iv?: string): { encrypted: string; iv: string } {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString, key, iv);
  }

  /**
   * Déchiffre un objet JSON
   */
  decryptObject<T>(encryptedData: string, key: string, iv: string): T {
    const decryptedString = this.decrypt(encryptedData, key, iv);
    return JSON.parse(decryptedString);
  }

  /**
   * Hache un mot de passe avec bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Vérifie un mot de passe avec bcrypt
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Génère un token sécurisé
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Génère un hash SHA-256
   */
  generateHash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}