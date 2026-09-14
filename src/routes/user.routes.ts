import { Router } from 'express';
import { getPublicUser } from '../controllers/user.controller.js';

const router = Router();

router.get('/:id', getPublicUser);

export default router;
