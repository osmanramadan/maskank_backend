import {
  getAuthenticatedUser,
  loginUser,
  registerUser,
  sanitizeUser
} from '../services/auth.service.js';

export async function register(request, response, next) {
  try {
    const result = await registerUser(request.body);
    response.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function login(request, response, next) {
  try {
    const result = await loginUser(request.body);
    response.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(request, response, next) {
  try {
    const user = await getAuthenticatedUser(request.user.id);
    response.json({
      success: true,
      data: { user: sanitizeUser(user) }
    });
  } catch (error) {
    next(error);
  }
}
