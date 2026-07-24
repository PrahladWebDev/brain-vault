import { Router } from 'express';
import { getGraph, createEdge, deleteEdge } from '../controllers/graphController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.get('/', getGraph);
router.post('/edges', createEdge);
router.delete('/edges', deleteEdge);

export default router;
