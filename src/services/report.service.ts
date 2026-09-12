import { createPropertyReport } from '../models/report.model.js';

const reportReasons = new Set([
  'fake_property',
  'incorrect_information',
  'wrong_price',
  'duplicate_listing',
  'inappropriate_content',
  'other'
]);

function reportError(message: string, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function submitPropertyReport(reporterId: number, propertyIdValue: string, input: { reason?: string; details?: string }) {
  const propertyId = Number(propertyIdValue);
  if (!Number.isInteger(propertyId) || propertyId < 1) throw reportError('Invalid property id');

  const reason = String(input.reason || '').trim();
  if (!reportReasons.has(reason)) throw reportError('Invalid report reason');

  const details = input.details === undefined || input.details === null ? null : String(input.details).trim();
  if (details && details.length > 1000) throw reportError('Report details must be 1000 characters or fewer');

  try {
    const report = await createPropertyReport(propertyId, reporterId, reason, details);
    if (!report) throw reportError('Approved property not found', 404);
    return report;
  } catch (error) {
    if (error.code === '23505') throw reportError('You already submitted this report for this property', 409);
    throw error;
  }
}
