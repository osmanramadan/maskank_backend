import { Router } from 'express';
import {
  createPropertyHandler,
  deletePropertyHandler,
  getProperty,
  getMyProperty,
  listMyProperties,
  listProperties,
  updatePropertyHandler
} from '../controllers/property.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import imageRoutes from './image.routes.js';
import reportRoutes from './report.routes.js';

const router = Router();
const ownerRoles = requireRole('USER', 'OWNER', 'BROKER', 'COMPANY', 'ADMIN');

router.get('/', listProperties);
router.get('/mine', requireAuth, listMyProperties);
router.get('/mine/:id', requireAuth, ownerRoles, getMyProperty);
router.use('/:id/images', imageRoutes);
router.use('/:id/report', reportRoutes);
router.get('/:id', getProperty);
router.post('/', requireAuth, ownerRoles, createPropertyHandler);
router.put('/:id', requireAuth, ownerRoles, updatePropertyHandler);
router.delete('/:id', requireAuth, ownerRoles, deletePropertyHandler);

export default router;
