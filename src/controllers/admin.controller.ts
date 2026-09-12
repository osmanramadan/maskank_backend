import {
  changePropertyStatus,
  getAdminStats,
  listProperties,
  listReports,
  listUsers,
  removeProperty,
  resolveReport
} from '../services/admin.service.js';

export async function stats(_request, response, next) {
  try { response.json({ success: true, data: await getAdminStats() }); } catch (error) { next(error); }
}

export async function users(request, response, next) {
  try { response.json({ success: true, ...(await listUsers(request.query)) }); } catch (error) { next(error); }
}

export async function properties(request, response, next) {
  try { response.json({ success: true, ...(await listProperties(request.query)) }); } catch (error) { next(error); }
}

export async function approveProperty(request, response, next) {
  try { response.json({ success: true, message: 'Property approved', data: await changePropertyStatus(request.params.id, 'approved', request.user.id) }); } catch (error) { next(error); }
}

export async function rejectProperty(request, response, next) {
  try { response.json({ success: true, message: 'Property rejected', data: await changePropertyStatus(request.params.id, 'rejected', request.user.id, request.body.reason) }); } catch (error) { next(error); }
}

export async function markSold(request, response, next) {
  try { response.json({ success: true, message: 'Property marked as sold', data: await changePropertyStatus(request.params.id, 'sold', request.user.id) }); } catch (error) { next(error); }
}

export async function markRented(request, response, next) {
  try { response.json({ success: true, message: 'Property marked as rented', data: await changePropertyStatus(request.params.id, 'rented', request.user.id) }); } catch (error) { next(error); }
}

export async function deleteProperty(request, response, next) {
  try { await removeProperty(request.params.id); response.json({ success: true, message: 'Property deleted successfully' }); } catch (error) { next(error); }
}

export async function reports(request, response, next) {
  try { response.json({ success: true, ...(await listReports(request.query)) }); } catch (error) { next(error); }
}

export async function resolveReportHandler(request, response, next) {
  try { response.json({ success: true, message: 'Report resolved', data: await resolveReport(request.params.id, request.user.id) }); } catch (error) { next(error); }
}
