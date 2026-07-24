import { Router } from 'express';
import { exportLinks, importBookmarks } from '../controllers/exportController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.get('/export', exportLinks);
router.post('/import/bookmarks', importBookmarks);

export default router;
