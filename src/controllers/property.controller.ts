import {
  createOwnerProperty,
  deleteOwnerProperty,
  getOwnerProperty,
  getOwnerProperties,
  getPublicProperty,
  listPublicProperties,
  updateOwnerProperty
} from '../services/property.service.js';

export async function listProperties(request, response, next) {
  try {
    response.json({ success: true, ...(await listPublicProperties(request.query)) });
  } catch (error) { next(error); }
}

export async function getProperty(request, response, next) {
  try {
    response.json({
      success: true,
      data: await getPublicProperty(request.params.id, {
        userId: request.user?.id || null,
        ipAddress: request.ip || null
      })
    });
  } catch (error) { next(error); }
}

export async function listMyProperties(request, response, next) {
  try {
    response.json({ success: true, data: await getOwnerProperties(request.user.id) });
  } catch (error) { next(error); }
}

export async function getMyProperty(request, response, next) {
  try {
    response.json({ success: true, data: await getOwnerProperty(request.params.id, request.user.id) });
  } catch (error) { next(error); }
}

export async function createPropertyHandler(request, response, next) {
  try {
    response.status(201).json({ success: true, message: 'Property submitted for approval', data: await createOwnerProperty(request.user.id, request.body) });
  } catch (error) { next(error); }
}

export async function updatePropertyHandler(request, response, next) {
  try {
    response.json({ success: true, message: 'Property updated and resubmitted for approval', data: await updateOwnerProperty(request.params.id, request.user.id, request.body) });
  } catch (error) { next(error); }
}

export async function deletePropertyHandler(request, response, next) {
  try {
    await deleteOwnerProperty(request.params.id, request.user.id);
    response.json({ success: true, message: 'Property deleted successfully' });
  } catch (error) { next(error); }
}
