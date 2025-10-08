import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authRateLimit, generalRateLimit } from '../middleware/security.middleware';

const router = Router();

// Routes d'authentification avec limitation de taux
router.post('/register', 
  authRateLimit,
  AuthController.getRegisterValidationRules(),
  AuthController.register
);

router.post('/login', 
  authRateLimit,
  AuthController.getLoginValidationRules(),
  AuthController.login
);

router.post('/logout', 
  generalRateLimit,
  AuthController.logout
);

router.get('/verify', 
  generalRateLimit,
  AuthController.verifyToken
);

export default router;
