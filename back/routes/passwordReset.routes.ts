import { Router } from 'express';
import { body } from 'express-validator';
import { PasswordResetController } from '../controllers/passwordReset.controller';

const router = Router();

// Validation pour la demande de réinitialisation
const requestResetValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide')
    .isLength({ min: 5, max: 255 })
    .withMessage('Email doit contenir entre 5 et 255 caractères')
];

// Validation pour la réinitialisation
const resetPasswordValidation = [
  body('token')
    .isLength({ min: 64, max: 64 })
    .withMessage('Token invalide'),
  body('csrfToken')
    .isLength({ min: 64, max: 64 })
    .withMessage('Token CSRF invalide'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit contenir au moins 8 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial')
];

// Routes
router.post('/request', requestResetValidation, PasswordResetController.requestPasswordReset);
router.get('/validate', PasswordResetController.validateResetToken);
router.post('/reset', resetPasswordValidation, PasswordResetController.resetPassword);
router.get('/test-email', PasswordResetController.testEmailConfig);
router.post('/cleanup', PasswordResetController.cleanupExpiredTokens);

export default router;
