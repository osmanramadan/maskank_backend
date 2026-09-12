import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createUser, findUserByEmail, findUserById } from '../models/user.model.js';

const registrationRoles = new Set(['USER', 'OWNER', 'BROKER']);

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function createAuthError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function createToken(user) {
  return jwt.sign(
    { sub: String(user.id), role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function sanitizeUser(user) {
  const { password_hash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export async function registerUser({ fullName, email, phone, password, role = 'USER' }) {
  if (!fullName || !email || !phone || !password) {
    throw createAuthError('Full name, email, phone, and password are required');
  }

  if (fullName.trim().length < 2 || fullName.trim().length > 120) {
    throw createAuthError('Full name must be between 2 and 120 characters');
  }

  if (password.length < 8) {
    throw createAuthError('Password must contain at least 8 characters');
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedRole = String(role).toUpperCase();

  if (!registrationRoles.has(normalizedRole)) {
    throw createAuthError('Invalid registration role');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw createAuthError('A valid email address is required');
  }

  const existingUser = await findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw createAuthError('Email is already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);

  try {
    const user = await createUser({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      passwordHash,
      role: normalizedRole
    });

    return { user, token: createToken(user) };
  } catch (error) {
    if (error.code === '23505') {
      throw createAuthError('Email or phone is already registered', 409);
    }
    throw error;
  }
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw createAuthError('Email and password are required', 400);
  }

  const user = await findUserByEmail(normalizeEmail(email));
  const passwordMatches = user && await bcrypt.compare(password, user.password_hash);

  if (!user || !passwordMatches || !user.is_active) {
    throw createAuthError('Invalid email or password', 401);
  }

  return { user: sanitizeUser(user), token: createToken(user) };
}

export async function getAuthenticatedUser(userId) {
  const user = await findUserById(userId);
  if (!user || !user.is_active) {
    throw createAuthError('User account not found or inactive', 401);
  }
  return user;
}

export { sanitizeUser };
