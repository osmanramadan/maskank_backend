import { updateAvatar } from '../services/avatar.service.js';

export async function uploadAvatar(request, response, next) {
  try {
    const user = await updateAvatar(request.user.id, request.file);
    response.json({
      success: true,
      message: 'Profile image updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
}
