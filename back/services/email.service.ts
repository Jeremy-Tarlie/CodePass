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
    // URL de la page web de réinitialisation (servie par le backend)
    const backendUrl = process.env.BACKEND_URL || 'https://gestion-mdp.codepath.fr';
    const webUrl = `${backendUrl}/reset-password.html?token=${token}&csrf=${csrfToken}`;
    
    // Utiliser l'URL web comme lien principal
    const primaryUrl = webUrl;
    
    const content: EmailContent = {
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Codepass',
      html: this.generatePasswordResetHtml(primaryUrl),
      text: this.generatePasswordResetText(primaryUrl)
    };

    return this.sendEmail(content);
  }

  /**
   * Génère le HTML pour l'email de réinitialisation
   */
  private generatePasswordResetHtml(primaryUrl: string): string {
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
            <h1>🔐 Codepass</h1>
          </div>
          <div class="content">
            <h2>Réinitialisation de votre mot de passe</h2>
            <p>Bonjour,</p>
            <p>Vous avez demandé la réinitialisation de votre mot de passe. Pour procéder à la réinitialisation, cliquez sur le bouton ci-dessous :</p>
            
            <div style="text-align: center;">
              <a href="${primaryUrl}" class="button">Réinitialiser mon mot de passe</a>
            </div>
            
            <p style="text-align: center; margin: 20px 0;">
              <small>Ce lien ouvrira la page de réinitialisation dans votre navigateur</small>
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
            <p>© 2025 Codepass - Tous droits réservés</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Génère le texte pour l'email de réinitialisation
   */
  private generatePasswordResetText(primaryUrl: string): string {
    return `
      Réinitialisation de votre mot de passe - Codepass
      
      Bonjour,
      
      Vous avez demandé la réinitialisation de votre mot de passe. Pour procéder à la réinitialisation, utilisez le lien ci-dessous :
      
      Lien pour réinitialiser votre mot de passe :
      ${primaryUrl}
      
      IMPORTANT :
      - Ce lien expire dans 15 minutes
      - Il ne peut être utilisé qu'une seule fois
      - Si vous n'avez pas demandé cette réinitialisation, ignorez cet email
      
      Si vous avez des questions, contactez notre support.
      
      Cet email a été envoyé automatiquement, merci de ne pas y répondre.
      
      © 2025 Codepass - Tous droits réservés
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

  /**
   * Envoie un email de notification de changement de mot de passe
   */
  async sendPasswordChangeNotification(email: string): Promise<{ success: boolean; message: string }> {
    const date = new Date().toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    const content: EmailContent = {
      to: email,
      subject: '🔒 Votre mot de passe a été modifié - Codepass',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Changement de mot de passe</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Codepass</h1>
            </div>
            <div class="content">
              <h2>✅ Mot de passe modifié avec succès</h2>
              <p>Bonjour,</p>
              <p>Votre mot de passe a été modifié le <strong>${date}</strong>.</p>
              
              <div class="warning">
                <strong>⚠️ Vous n'êtes pas à l'origine de cette modification ?</strong>
                <p>Si vous n'avez pas effectué cette modification, votre compte pourrait être compromis. Nous vous recommandons de :</p>
                <ul>
                  <li>Réinitialiser immédiatement votre mot de passe</li>
                  <li>Vérifier l'activité récente de votre compte</li>
                  <li>Contacter notre support si nécessaire</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>© 2025 Codepass - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Mot de passe modifié avec succès - Codepass
        
        Bonjour,
        
        Votre mot de passe a été modifié le ${date}.
        
        Vous n'êtes pas à l'origine de cette modification ?
        Si vous n'avez pas effectué cette modification, votre compte pourrait être compromis.
        Réinitialisez immédiatement votre mot de passe et contactez notre support.
        
        © 2025 Codepass - Tous droits réservés
      `
    };

    return this.sendEmail(content);
  }

  /**
   * Envoie un email de notification de changement d'email (à l'ancien email)
   */
  async sendEmailChangeNotification(oldEmail: string, newEmail: string): Promise<{ success: boolean; message: string }> {
    const date = new Date().toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    const content: EmailContent = {
      to: oldEmail,
      subject: '📧 Votre adresse email a été modifiée - Codepass',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Changement d'email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background-color: #e7f3ff; border: 1px solid #007bff; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Codepass</h1>
            </div>
            <div class="content">
              <h2>📧 Adresse email modifiée</h2>
              <p>Bonjour,</p>
              <p>L'adresse email associée à votre compte Codepass a été modifiée le <strong>${date}</strong>.</p>
              
              <div class="info-box">
                <strong>Nouvelle adresse email :</strong> ${newEmail}
              </div>
              
              <div class="warning">
                <strong>⚠️ Vous n'êtes pas à l'origine de cette modification ?</strong>
                <p>Si vous n'avez pas effectué cette modification, contactez immédiatement notre support.</p>
              </div>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>© 2025 Codepass - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Adresse email modifiée - Codepass
        
        Bonjour,
        
        L'adresse email associée à votre compte Codepass a été modifiée le ${date}.
        
        Nouvelle adresse email : ${newEmail}
        
        Vous n'êtes pas à l'origine de cette modification ?
        Contactez immédiatement notre support.
        
        © 2025 Codepass - Tous droits réservés
      `
    };

    return this.sendEmail(content);
  }

  /**
   * Envoie un email de confirmation au nouvel email
   */
  async sendEmailChangeConfirmation(newEmail: string): Promise<{ success: boolean; message: string }> {
    const date = new Date().toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    const content: EmailContent = {
      to: newEmail,
      subject: '✅ Bienvenue ! Votre email a été confirmé - Codepass',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email confirmé</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Codepass</h1>
            </div>
            <div class="content">
              <h2>✅ Email confirmé avec succès</h2>
              <p>Bonjour,</p>
              <p>Cette adresse email (<strong>${newEmail}</strong>) est maintenant associée à votre compte Codepass.</p>
              <p>Date de modification : <strong>${date}</strong></p>
              <p>Vous pouvez désormais utiliser cette adresse pour vous connecter.</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>© 2025 Codepass - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Email confirmé avec succès - Codepass
        
        Bonjour,
        
        Cette adresse email (${newEmail}) est maintenant associée à votre compte Codepass.
        
        Date de modification : ${date}
        
        Vous pouvez désormais utiliser cette adresse pour vous connecter.
        
        © 2025 Codepass - Tous droits réservés
      `
    };

    return this.sendEmail(content);
  }

  /**
   * Envoie un email de notification de changement d'email de secours
   */
  async sendBackupEmailChangeNotification(email: string, newBackupEmail: string | null): Promise<{ success: boolean; message: string }> {
    const date = new Date().toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    const content: EmailContent = {
      to: email,
      subject: '🔐 Votre email de secours a été modifié - Codepass',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email de secours modifié</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6c757d; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background-color: #e7f3ff; border: 1px solid #007bff; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Codepass</h1>
            </div>
            <div class="content">
              <h2>🔒 Email de secours modifié</h2>
              <p>Bonjour,</p>
              <p>L'email de secours de votre compte Codepass a été modifié le <strong>${date}</strong>.</p>
              
              <div class="info-box">
                ${newBackupEmail 
                  ? `<strong>Nouvel email de secours :</strong> ${newBackupEmail}`
                  : '<strong>L\'email de secours a été supprimé de votre compte.</strong>'
                }
              </div>
              
              <p>L'email de secours vous permet de récupérer votre compte en cas de perte d'accès à votre email principal.</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>© 2025 Codepass - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Email de secours modifié - Codepass
        
        Bonjour,
        
        L'email de secours de votre compte Codepass a été modifié le ${date}.
        
        ${newBackupEmail 
          ? `Nouvel email de secours : ${newBackupEmail}`
          : 'L\'email de secours a été supprimé de votre compte.'
        }
        
        © 2025 Codepass - Tous droits réservés
      `
    };

    return this.sendEmail(content);
  }

  /**
   * Envoie un email de confirmation à l'email de secours
   */
  async sendBackupEmailConfirmation(backupEmail: string): Promise<{ success: boolean; message: string }> {
    const date = new Date().toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    const content: EmailContent = {
      to: backupEmail,
      subject: '✅ Vous êtes configuré comme email de secours - Codepass',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email de secours configuré</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .info-box { background-color: #d4edda; border: 1px solid #28a745; padding: 15px; border-radius: 4px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Codepass</h1>
            </div>
            <div class="content">
              <h2>✅ Email de secours configuré</h2>
              <p>Bonjour,</p>
              <p>Cette adresse email (<strong>${backupEmail}</strong>) a été configurée comme email de secours pour un compte Codepass le <strong>${date}</strong>.</p>
              
              <div class="info-box">
                <strong>Que signifie cela ?</strong>
                <p>En tant qu'email de secours, vous recevrez des notifications importantes concernant la sécurité du compte et pourrez être utilisé pour la récupération du compte si nécessaire.</p>
              </div>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>© 2025 Codepass - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Email de secours configuré - Codepass
        
        Bonjour,
        
        Cette adresse email (${backupEmail}) a été configurée comme email de secours pour un compte Codepass le ${date}.
        
        En tant qu'email de secours, vous recevrez des notifications importantes concernant la sécurité du compte.
        
        © 2025 Codepass - Tous droits réservés
      `
    };

    return this.sendEmail(content);
  }

  /**
   * Envoie un email de notification de suppression d'email de secours
   */
  async sendBackupEmailRemovedNotification(backupEmail: string): Promise<{ success: boolean; message: string }> {
    const date = new Date().toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    const content: EmailContent = {
      to: backupEmail,
      subject: 'ℹ️ Vous n\'êtes plus email de secours - Codepass',
      html: `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email de secours retiré</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6c757d; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Codepass</h1>
            </div>
            <div class="content">
              <h2>ℹ️ Email de secours retiré</h2>
              <p>Bonjour,</p>
              <p>Cette adresse email (<strong>${backupEmail}</strong>) n'est plus configurée comme email de secours pour un compte Codepass depuis le <strong>${date}</strong>.</p>
              <p>Vous ne recevrez plus de notifications concernant ce compte.</p>
            </div>
            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>© 2025 Codepass - Tous droits réservés</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Email de secours retiré - Codepass
        
        Bonjour,
        
        Cette adresse email (${backupEmail}) n'est plus configurée comme email de secours pour un compte Codepass depuis le ${date}.
        
        Vous ne recevrez plus de notifications concernant ce compte.
        
        © 2025 Codepass - Tous droits réservés
      `
    };

    return this.sendEmail(content);
  }
}