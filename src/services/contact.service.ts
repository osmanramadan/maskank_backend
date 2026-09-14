import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function contactError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function sendContactMessage(input) {
  const name = String(input.name || '').trim();
  const email = String(input.email || '').trim();
  const phone = String(input.phone || '').trim();
  const subject = String(input.subject || '').trim();
  const message = String(input.message || '').trim();

  if (name.length < 2 || name.length > 120) throw contactError('Name must be between 2 and 120 characters');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw contactError('A valid email is required');
  if (phone.length > 40) throw contactError('Phone number is too long');
  if (subject.length < 2 || subject.length > 180) throw contactError('Subject must be between 2 and 180 characters');
  if (message.length < 10 || message.length > 5000) throw contactError('Message must be between 10 and 5000 characters');
  if (!env.smtpHost || !env.smtpUser || !env.smtpPassword || !env.contactEmail) {
    throw contactError('Email service is not configured', 503);
  }
  if (/\s/.test(env.smtpHost)) {
    throw contactError('Email service is misconfigured: SMTP_HOST must contain one hostname only.', 503);
  }

  const transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: { user: env.smtpUser, pass: env.smtpPassword }
  });

  try {
    await transporter.sendMail({
      from: env.smtpUser,
      to: env.contactEmail,
      replyTo: email,
      subject: `[Maskank Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || 'Not provided'}\n\n${message}`
    });
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'EAUTH') {
      throw contactError('Email service authentication failed. Check SMTP_USER and SMTP_PASSWORD.', 503);
    }
    if (typeof error === 'object' && error !== null && 'code' in error && ['EDNS', 'ENOTFOUND', 'EAI_AGAIN'].includes(String(error.code))) {
      throw contactError('Email service connection failed. Check SMTP_HOST in the deployment environment.', 503);
    }
    throw error;
  }
}
