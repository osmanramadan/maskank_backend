import {
  createMessage,
  findUserMessages,
  markMessageAsRead
} from '../models/message.model.js';

function messageError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseId(value, field) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw messageError(`Invalid ${field}`);
  return id;
}

export function listMessages(userId) {
  return findUserMessages(userId);
}

export async function sendPropertyInquiry(senderId, input) {
  const propertyId = parseId(input.propertyId ?? input.property_id, 'property id');
  const message = String(input.message || '').trim();
  if (message.length < 1 || message.length > 5000) {
    throw messageError('Message must be between 1 and 5000 characters');
  }

  const created = await createMessage({ senderId, propertyId, message });
  if (!created) {
    throw messageError('Approved property not found or cannot be contacted', 404);
  }
  return created;
}

export async function readMessage(messageIdValue, userId) {
  const messageId = parseId(messageIdValue, 'message id');
  const updated = await markMessageAsRead(messageId, userId);
  if (!updated) throw messageError('Message not found or not addressed to you', 404);
  return updated;
}
