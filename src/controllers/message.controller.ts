import {
  listMessages,
  readMessage,
  sendPropertyInquiry
} from '../services/message.service.js';

export async function getMessages(request, response, next) {
  try {
    response.json({ success: true, data: await listMessages(request.user.id) });
  } catch (error) {
    next(error);
  }
}

export async function createMessageHandler(request, response, next) {
  try {
    const message = await sendPropertyInquiry(request.user.id, request.body);
    response.status(201).json({
      success: true,
      message: 'Inquiry sent successfully',
      data: message
    });
  } catch (error) {
    next(error);
  }
}

export async function markReadHandler(request, response, next) {
  try {
    const message = await readMessage(request.params.id, request.user.id);
    response.json({ success: true, data: message });
  } catch (error) {
    next(error);
  }
}
