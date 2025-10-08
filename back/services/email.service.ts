import nodemailer from 'nodemailer';

export interface EmailContent {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configuration du transporteur email
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', // true pour 465, false pour autres ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 60000, // 60 secondes
      greetingTimeout: 30000,   // 30 secondes
      socketTimeout: 60000      // 60 secondes
    });
  }

  /**
   * Envoie un email
   */
  async sendEmail(content: EmailContent): Promise<{ success: boolean; message: string }> {
    try {
      // Vérification de la configuration
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('⚠️ Configuration SMTP manquante, passage en mode simulation');
        console.log('📧 Email à envoyer (simulation):', {
          to: content.to,
          subject: content.subject,
          html: content.html.substring(0, 100) + '...'
        });
        
        return {
          success: true,
          message: 'Email envoyé avec succès (simulation - configuration SMTP manquante)'
        };
      }

      // Envoi réel de l'email
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: content.to,
        subject: content.subject,
        html: content.html,
        text: content.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('✅ Email envoyé avec succès:', {
        to: content.to,
        subject: content.subject,
        messageId: result.messageId
      });

      return {
        success: true,
        message: 'Email envoyé avec succès'
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'email:', error);
      return {
        success: false,
        message: `Erreur lors de l'envoi de l'email: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  /**
   * Envoie un email de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(email: string, token: string, csrfToken: string): Promise<{ success: boolean; message: string }> {
    // URL pour ouvrir l'application Electron
    const electronUrl = `gestmdp://reset-password?token=${token}&csrf=${csrfToken}`;
    // URL de fallback pour le navigateur web
    const webUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}&csrf=${csrfToken}`;
    
    // En mode développement, utiliser le lien web comme lien principal
    const isDevelopment = process.env.NODE_ENV === 'development';
    const primaryUrl = isDevelopment ? webUrl : electronUrl;
    const secondaryUrl = isDevelopment ? electronUrl : webUrl;
    
    const content: EmailContent = {
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Gestionnaire de Mots de Passe',
      html: this.generatePasswordResetHtml(primaryUrl, secondaryUrl, isDevelopment),
      text: this.generatePasswordResetText(primaryUrl, secondaryUrl, isDevelopment)
    };

    return this.sendEmail(content);
  }

  /**
   * Génère le HTML pour l'email de réinitialisation
   */
  private generatePasswordResetHtml(primaryUrl: string, secondaryUrl: string, isDevelopment: boolean = false): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Réinitialisation de mot de passe</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          .button:hover { background-color: #0056b3; }
          .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Gestionnaire de Mots de Passe</h1>
          </div>
          <div class="content">
            <h2>Réinitialisation de votre mot de passe</h2>
            <p>Bonjour,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Pour procéder à la réinitialisation, cliquez sur le bouton ci-dessous :</p>
            
            <div style="text-align: center;">
              <a href="${primaryUrl}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            
            <p style="text-align: center; margin: 20px 0;">
              <small>${isDevelopment ? 'Mode développement - Lien web' : 'Si le bouton ne fonctionne pas, vous pouvez également utiliser le lien web :'}</small><br>
              <a href="${secondaryUrl}" style="color: #007bff; text-decoration: underline;">${isDevelopment ? 'Lien application Electron' : 'Lien web de réinitialisation'}</a>
            </p>
            
            <div class="warning">
              <strong>⚠️ Important :</strong>
              <ul>
                <li>Ce lien expire dans <strong>15 minutes</strong></li>
                <li>Il ne peut être utilisé qu'<strong>une seule fois</strong></li>
                <li>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email</li>
              </ul>
            </div>
            
            <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
            <p style="word-break: break-all; background-color: #e9ecef; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${primaryUrl}
            </p>
          </div>
          <div class="footer">
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
            <p>© 2024 Gestionnaire de Mots de Passe - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Génère le texte pour l'email de réinitialisation
   */
  private generatePasswordResetText(primaryUrl: string, secondaryUrl: string, isDevelopment: boolean = false): string {
    return `
      Réinitialisation de votre mot de passe - Gestionnaire de Mots de Passe
      
      Bonjour,
      
      Vous avez demandé la réinitialisation de votre mot de passe. Pour procéder à la réinitialisation, utilisez l'un des liens ci-dessous :
      
      ${isDevelopment ? 'Lien web (mode développement) :' : 'Lien pour l\'application (recommandé) :'}
      ${primaryUrl}
      
      ${isDevelopment ? 'Lien application Electron :' : 'Lien web (fallback) :'}
      ${secondaryUrl}
      
      IMPORTANT :
      - Ce lien expire dans 15 minutes
      - Il ne peut être utilisé qu'une seule fois
      - Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
      
      Si vous avez des questions, contactez notre support.
      
      Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      
      © 2024 Gestionnaire de Mots de Passe - Tous droits réservés
    `;
  }

  /**
   * Teste la configuration email
   */
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Vérification de la configuration
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return {
          success: false,
          message: 'Configuration SMTP manquante (SMTP_USER et SMTP_PASS requis)'
        };
      }

      // Test de connexion
      await this.transporter.verify();
      
      return {
        success: true,
        message: 'Configuration email valide et connexion réussie'
      };
    } catch (error) {
      console.error('Erreur de configuration email:', error);
      return {
        success: false,
        message: `Configuration email invalide: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }
}