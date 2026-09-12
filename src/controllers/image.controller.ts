import {
  addPropertyImages,
  deletePropertyImage,
  setMainPropertyImage
} from '../services/image.service.js';

export async function uploadImages(request, response, next) {
  try {
    const images = await addPropertyImages(request.params.id, request.user.id, request.files);
    response.status(201).json({
      success: true,
      message: 'Property images uploaded successfully',
      data: images
    });
  } catch (error) { next(error); }
}

export async function deleteImage(request, response, next) {
  try {
    await deletePropertyImage(request.params.id, request.params.imageId, request.user.id);
    response.json({ success: true, message: 'Property image deleted successfully' });
  } catch (error) { next(error); }
}

export async function setMainImage(request, response, next) {
  try {
    const image = await setMainPropertyImage(request.params.id, request.params.imageId, request.user.id);
    response.json({ success: true, message: 'Main property image updated', data: image });
  } catch (error) { next(error); }
}
