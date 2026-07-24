import { Router } from 'express';
import { getTags } from '../controllers/tagController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);
router.get('/', getTags);

export default router;
