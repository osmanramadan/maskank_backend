import { sendContactMessage } from '../services/contact.service.js';

export async function createContactMessage(request, response, next) {
  try {
    await sendContactMessage(request.body);
    response.status(202).json({ success: true, message: 'Contact message sent successfully' });
  } catch (error) {
    next(error);
  }
}
