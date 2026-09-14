import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getAuthenticatedUser } from '../services/auth.service.js';

export async function requireAuth(request, _response, next) {
  try {
    const authorization = request.headers.authorization;
    if (!authorization || !authorization.startsWith('Bearer ')) {
      const error = new Error('Authentication is required');
      error.statusCode = 401;
      throw error;
    }

    const token = authorization.slice('Bearer '.length);
    const payload = jwt.verify(token, env.jwtSecret);
    request.user = await getAuthenticatedUser(payload.sub);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      error.statusCode = 401;
      error.message = 'Invalid or expired authentication token';
    }
    next(error);
  }
}

export async function optionalAuth(request, _response, next) {
  try {
    const authorization = request.headers.authorization;
    if (!authorization) {
      next();
      return;
    }
    if (!authorization.startsWith('Bearer ')) {
      const error = new Error('Invalid authentication token');
      error.statusCode = 401;
      throw error;
    }

    const token = authorization.slice('Bearer '.length);
    const payload = jwt.verify(token, env.jwtSecret);
    request.user = await getAuthenticatedUser(payload.sub);
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      error.statusCode = 401;
      error.message = 'Invalid or expired authentication token';
    }
    next(error);
  }
}

export function requireRole(...allowedRoles) {
  return (request, _response, next) => {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      const error = new Error('You do not have permission to perform this action');
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
}
