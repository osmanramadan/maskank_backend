import { Router } from 'express';
import { getMe, login, register, updatePhone, updateRole } from '../controllers/auth.controller.js';
import { uploadAvatar } from '../controllers/avatar.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadAvatar as uploadAvatarFile } from '../middleware/upload.middleware.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);
router.patch('/me/role', requireAuth, updateRole);
router.patch('/me/phone', requireAuth, updatePhone);
router.post('/me/avatar', requireAuth, uploadAvatarFile.single('avatar'), uploadAvatar);

export default router;
