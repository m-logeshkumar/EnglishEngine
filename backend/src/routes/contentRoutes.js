import { Router } from 'express';
import { createContent, deleteContent, getByType } from '../controllers/contentController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:type', getByType);
router.post('/:type', requireAuth, requireAdmin, createContent);
router.delete('/:type/:id', requireAuth, requireAdmin, deleteContent);

export default router;
