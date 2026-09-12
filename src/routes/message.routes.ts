import { Router } from 'express';
import {
  createMessageHandler,
  getMessages,
  markReadHandler
} from '../controllers/message.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/', getMessages);
router.post('/', createMessageHandler);
router.put('/:id/read', markReadHandler);

export default router;
