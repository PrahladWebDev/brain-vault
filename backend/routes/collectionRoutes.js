import { Router } from 'express';
import { createCollection, getCollections, updateCollection, deleteCollection } from '../controllers/collectionController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();
router.use(protect);

router.post('/', createCollection);
router.get('/', getCollections);
router.patch('/:id', updateCollection);
router.delete('/:id', deleteCollection);

export default router;
