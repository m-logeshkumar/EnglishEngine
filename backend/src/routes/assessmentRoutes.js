import { Router } from 'express';
import { analyzeJam, analyzeListening, analyzeReading, getAiStatus } from '../controllers/assessmentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/status', getAiStatus);
router.post('/reading', requireAuth, analyzeReading);
router.post('/listening', requireAuth, analyzeListening);
router.post('/jam', requireAuth, analyzeJam);

export default router;
