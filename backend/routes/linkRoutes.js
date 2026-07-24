import { Router } from 'express';
import {
  saveLink, getLinks, getTrash, getLinkById, updateLink, toggleFavorite, togglePin,
  toggleArchive, softDeleteLink, restoreLink, permanentlyDeleteLink, emptyTrash,
  setReadLater, addManualRelated,
} from '../controllers/linkController.js';
import { saveLinkValidator, updateLinkValidator } from '../validators/linkValidator.js';
import { validateRequest } from '../validators/validateRequest.js';
import { protect } from '../middlewares/auth.js';
import { saveLinkLimiter } from '../middlewares/rateLimiter.js';

const router = Router();
router.use(protect);

router.post('/', saveLinkLimiter, saveLinkValidator, validateRequest, saveLink);
router.get('/', getLinks);
router.get('/trash', getTrash);
router.delete('/trash', emptyTrash);
router.get('/:id', getLinkById);
router.patch('/:id', updateLinkValidator, validateRequest, updateLink);
router.patch('/:id/favorite', toggleFavorite);
router.patch('/:id/pin', togglePin);
router.patch('/:id/archive', toggleArchive);
router.patch('/:id/read-later', setReadLater);
router.post('/:id/related/:targetId', addManualRelated);
router.delete('/:id', softDeleteLink);
router.patch('/:id/restore', restoreLink);
router.delete('/:id/permanent', permanentlyDeleteLink);

export default router;
