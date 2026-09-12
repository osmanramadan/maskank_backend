import { findLocations } from '../models/location.model.js';

export async function listLocations(_request, response, next) {
  try {
    response.json({ success: true, data: await findLocations() });
  } catch (error) {
    next(error);
  }
}
