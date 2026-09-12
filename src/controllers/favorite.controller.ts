import {
  listFavorites,
  saveFavorite,
  unsaveFavorite
} from '../services/favorite.service.js';

export async function getFavorites(request, response, next) {
  try {
    response.json({
      success: true,
      data: await listFavorites(request.user.id)
    });
  } catch (error) {
    next(error);
  }
}

export async function addFavoriteHandler(request, response, next) {
  try {
    const favorite = await saveFavorite(request.user.id, request.params.propertyId);
    response.status(201).json({
      success: true,
      message: 'Property added to favorites',
      data: favorite
    });
  } catch (error) {
    next(error);
  }
}

export async function removeFavoriteHandler(request, response, next) {
  try {
    await unsaveFavorite(request.user.id, request.params.propertyId);
    response.json({
      success: true,
      message: 'Property removed from favorites'
    });
  } catch (error) {
    next(error);
  }
}
