import {
  addFavorite,
  findUserFavorites,
  removeFavorite
} from '../models/favorite.model.js';

function favoriteError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parsePropertyId(value) {
  const propertyId = Number(value);
  if (!Number.isInteger(propertyId) || propertyId < 1) {
    throw favoriteError('Invalid property id');
  }
  return propertyId;
}

export function listFavorites(userId) {
  return findUserFavorites(userId);
}

export async function saveFavorite(userId, propertyIdValue) {
  const propertyId = parsePropertyId(propertyIdValue);
  const favorite = await addFavorite(userId, propertyId);
  if (!favorite) {
    throw favoriteError('Approved property not found', 404);
  }
  return favorite;
}

export async function unsaveFavorite(userId, propertyIdValue) {
  const propertyId = parsePropertyId(propertyIdValue);
  const favorite = await removeFavorite(userId, propertyId);
  if (!favorite) {
    throw favoriteError('Favorite not found', 404);
  }
}
