import { Router } from 'express';
import { PasswordController } from '../controllers/password.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { generalRateLimit } from '../middleware/security.middleware';

const router = Router();

// Toutes les routes de mots de passe nécessitent une authentification
router.use(authenticateToken);
router.use(generalRateLimit);

// Routes pour la gestion des mots de passe
router.get('/', PasswordController.getAllPasswords);

router.get('/:id', PasswordController.getPassword);

router.post('/', 
  PasswordController.getPasswordValidationRules(),
  PasswordController.createPassword
);

router.put('/:id', 
  PasswordController.getPasswordValidationRules(),
  PasswordController.updatePassword
);

router.delete('/:id', PasswordController.deletePassword);

export default router;
