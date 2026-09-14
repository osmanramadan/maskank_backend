import { getPublicUserProfile } from '../services/user.service.js';

export async function getPublicUser(request, response, next) {
  try {
    const data = await getPublicUserProfile(request.params.id);
    response.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}
