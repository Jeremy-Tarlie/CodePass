import { Router } from 'express';
import { ApiKeyController } from '../controllers/apiKey.controller';
import { validateApiKey } from '../middleware/apiKey.middleware';

const router = Router();

// Route pour générer une nouvelle clé API (nécessite une authentification)
router.post('/generate', validateApiKey, ApiKeyController.generateNewApiKey);

// Route pour valider une clé API
router.post('/validate', ApiKeyController.validateApiKey);

// Route pour obtenir des informations sur l'API
router.get('/info', ApiKeyController.getApiInfo);

export default router;
