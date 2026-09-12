import { Router } from 'express';
import {
  approveProperty,
  deleteProperty,
  markRented,
  markSold,
  properties,
  property,
  rejectProperty,
  reports,
  resolveReportHandler,
  stats,
  users
} from '../controllers/admin.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));
router.get('/stats', stats);
router.get('/users', users);
router.get('/properties', properties);
router.get('/properties/:id', property);
router.put('/properties/:id/approve', approveProperty);
router.put('/properties/:id/reject', rejectProperty);
router.put('/properties/:id/sold', markSold);
router.put('/properties/:id/rented', markRented);
router.delete('/properties/:id', deleteProperty);
router.get('/reports', reports);
router.put('/reports/:id/resolve', resolveReportHandler);

export default router;
