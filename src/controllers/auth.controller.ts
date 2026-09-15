import {
  getAuthenticatedUser,
  loginUser,
  registerUser,
  updateAuthenticatedUserRole,
  updateAuthenticatedUserPhone,
  updateAuthenticatedUserFullName,
  updateAuthenticatedUserContactVisibility,
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

export async function updateRole(request, response, next) {
  try {
    const result = await updateAuthenticatedUserRole(request.user.id, request.body.role);
    response.json({
      success: true,
      message: 'Account role updated successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePhone(request, response, next) {
  try {
    const result = await updateAuthenticatedUserPhone(request.user.id, request.body.phone);
    response.json({ success: true, message: 'Phone number updated successfully', data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateFullName(request, response, next) {
  try {
    const result = await updateAuthenticatedUserFullName(request.user.id, request.body.fullName);
    response.json({ success: true, message: 'Full name updated successfully', data: result });
  } catch (error) {
    next(error);
  }
}

export async function updateContactVisibility(request, response, next) {
  try {
    const result = await updateAuthenticatedUserContactVisibility(
      request.user.id,
      request.body.field,
      request.body.visible
    );
    response.json({ success: true, message: 'Contact visibility updated successfully', data: result });
  } catch (error) {
    next(error);
  }
}
