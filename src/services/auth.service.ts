import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createUser, findUserByEmail, findUserById, findUserByPhone, updateUserPhone, updateUserRole } from '../models/user.model.js';

const registrationRoles = new Set(['USER', 'OWNER', 'BROKER', 'COMPANY']);

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
  if (!fullName || !email || !phone || !password || !String(fullName).trim() || !String(email).trim() || !String(phone).trim()) {
    throw createAuthError('Full name, email, phone, and password are required');
  }

  if (fullName.trim().length < 2 || fullName.trim().length > 120) {
    throw createAuthError('Full name must be between 2 and 120 characters');
  }

  if (password.length < 8) {
    throw createAuthError('Password must contain at least 8 characters');
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = String(phone).trim();
  const normalizedRole = String(role).toUpperCase();

  if (!/^01[0125]\d{8}$/.test(normalizedPhone)) {
    throw createAuthError('A valid Egyptian mobile number is required');
  }

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

  const existingPhone = await findUserByPhone(normalizedPhone);
  if (existingPhone) {
    throw createAuthError('Phone number is already registered', 409);
  }

  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);

  try {
    const user = await createUser({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
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

export async function updateAuthenticatedUserRole(userId, role) {
  const normalizedRole = String(role).toUpperCase();
  if (!registrationRoles.has(normalizedRole)) {
    throw createAuthError('Invalid account role');
  }

  const user = await findUserById(userId);
  if (!user || !user.is_active) {
    throw createAuthError('User account not found or inactive', 401);
  }
  if (user.role === 'ADMIN') {
    throw createAuthError('Administrator role cannot be changed', 403);
  }

  const updatedUser = await updateUserRole(userId, normalizedRole);
  if (!updatedUser) {
    throw createAuthError('User account not found', 404);
  }
  return { user: updatedUser, token: createToken(updatedUser) };
}

export async function updateAuthenticatedUserPhone(userId, phone) {
  const normalizedPhone = String(phone || '').trim();
  if (!/^01[0125]\d{8}$/.test(normalizedPhone)) {
    throw createAuthError('A valid Egyptian mobile number is required');
  }

  const user = await findUserById(userId);
  if (!user || !user.is_active) {
    throw createAuthError('User account not found or inactive', 401);
  }

  const existingPhone = await findUserByPhone(normalizedPhone);
  if (existingPhone && Number(existingPhone.id) !== Number(userId)) {
    throw createAuthError('Phone number is already registered', 409);
  }

  try {
    const updatedUser = await updateUserPhone(userId, normalizedPhone);
    if (!updatedUser) throw createAuthError('User account not found', 404);
    return { user: updatedUser };
  } catch (error) {
    if (error.code === '23505') {
      throw createAuthError('Phone number is already registered', 409);
    }
    throw error;
  }
}

export { sanitizeUser };
