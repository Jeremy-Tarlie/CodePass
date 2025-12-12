import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { generalRateLimit, authRateLimit } from '../middleware/security.middleware';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Toutes les routes requièrent l'authentification
router.use(authenticateToken);

// Récupérer le profil
router.get('/', 
  generalRateLimit,
  ProfileController.getProfile
);

// Modifier l'email
router.put('/email',
  authRateLimit,
  ProfileController.getUpdateEmailValidationRules(),
  ProfileController.updateEmail
);

// Modifier le mot de passe
router.put('/password',
  authRateLimit,
  ProfileController.getUpdatePasswordValidationRules(),
  ProfileController.updatePassword
);

// Modifier l'email de secours
router.put('/backup-email',
  authRateLimit,
  ProfileController.getUpdateBackupEmailValidationRules(),
  ProfileController.updateBackupEmail
);

export default router;

