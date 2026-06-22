import { Router } from 'express';
import { deleteUser, listUsers, login, me, signup } from '../controllers/authController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { validateSignup, validateLogin } from '../utils/validation.js';

const router = Router();

router.post('/signup', validateSignup, signup);
router.post('/login', validateLogin, login);
router.get('/me', requireAuth, me);
router.get('/users', requireAuth, requireAdmin, listUsers);
router.delete('/users/:id', requireAuth, requireAdmin, deleteUser);

export default router;
