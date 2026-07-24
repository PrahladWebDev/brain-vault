import { Router } from 'express';
import { register, login, logout, getMe, updateSettings } from '../controllers/authController.js';
import { registerValidator, loginValidator } from '../validators/authValidator.js';
import { validateRequest } from '../validators/validateRequest.js';
import { protect } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

router.post('/register', authLimiter, registerValidator, validateRequest, register);
router.post('/login', authLimiter, loginValidator, validateRequest, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.patch('/settings', protect, updateSettings);

export default router;
