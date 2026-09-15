import { findUserById } from '../models/user.model.js';
import { findPublicProperties } from '../models/property.model.js';

export async function getPublicUserProfile(userIdValue) {
  const userId = Number(userIdValue);
  if (!Number.isInteger(userId) || userId < 1) {
    const error = new Error('Invalid user id');
    error.statusCode = 400;
    throw error;
  }

  const user = await findUserById(userId);
  if (!user || !user.is_active) {
    const error = new Error('User profile not found');
    error.statusCode = 404;
    throw error;
  }

  const { rows: properties } = await findPublicProperties({
    page: 1,
    limit: 100,
    filters: { ownerId: userId },
    sort: 'p.created_at DESC'
  });

  return {
    user: {
      ...user,
      email: user.email_public ? user.email : null,
      phone: user.phone_public ? user.phone : null
    },
    properties
  };
}
