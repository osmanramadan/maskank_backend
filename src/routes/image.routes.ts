import { Router } from 'express';
import { deleteImage, setMainImage, uploadImages } from '../controllers/image.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { uploadPropertyImages } from '../middleware/upload.middleware.js';

const router = Router({ mergeParams: true });
const ownerRoles = requireRole('OWNER', 'BROKER');

router.post('/', requireAuth, ownerRoles, uploadPropertyImages.array('images'), uploadImages);
router.delete('/:imageId', requireAuth, ownerRoles, deleteImage);
router.put('/:imageId/main', requireAuth, ownerRoles, setMainImage);

export default router;
