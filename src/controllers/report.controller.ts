import { submitPropertyReport } from '../services/report.service.js';

export async function createReport(request, response, next) {
  try {
    const report = await submitPropertyReport(request.user.id, request.params.id, request.body);
    response.status(201).json({ success: true, message: 'Report submitted successfully', data: report });
  } catch (error) { next(error); }
}
