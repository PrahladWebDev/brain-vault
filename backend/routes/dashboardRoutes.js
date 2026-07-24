import { Router } from 'express';
import { getDashboard, getAnalytics } from '../controllers/dashboardController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.get('/', getDashboard);
router.get('/analytics', getAnalytics);

export default router;
