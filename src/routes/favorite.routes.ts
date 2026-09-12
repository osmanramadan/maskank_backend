import { Router } from 'express';
import {
  addFavoriteHandler,
  getFavorites,
  removeFavoriteHandler
} from '../controllers/favorite.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', getFavorites);
router.post('/:propertyId', addFavoriteHandler);
router.delete('/:propertyId', removeFavoriteHandler);

export default router;
