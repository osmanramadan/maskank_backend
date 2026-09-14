import {
  deleteAdminProperty,
  findAdminProperties,
  findAdminPropertyById,
  findAdminReports,
  findAdminUsers,
  getAdminStats,
  resolveAdminReport,
  setPropertyStatus
} from '../models/admin.model.js';

const propertyStatuses = new Set(['pending', 'approved', 'rejected', 'sold', 'rented']);
const userRoles = new Set(['USER', 'OWNER', 'BROKER', 'COMPANY', 'ADMIN']);

function adminError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseId(value, field) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw adminError(`Invalid ${field}`);
  return id;
}

function pagination(query) {
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1) {
    throw adminError('Page and limit must be positive whole numbers');
  }
  return { page, limit: Math.min(limit, 100) };
}

function paginatedResult(result, page, limit) {
  return {
    data: result.rows,
    pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }
  };
}

export { getAdminStats };

export async function listUsers(query) {
  const { page, limit } = pagination(query);
  const role = query.role ? String(query.role).toUpperCase() : undefined;
  if (role && !userRoles.has(role)) throw adminError('Invalid user role filter');
  const result = await findAdminUsers({ page, limit, role, search: query.search?.trim() });
  return paginatedResult(result, page, limit);
}

export async function listProperties(query) {
  const { page, limit } = pagination(query);
  const status = query.status ? String(query.status).toLowerCase() : undefined;
  if (status && !propertyStatuses.has(status)) throw adminError('Invalid property status filter');
  const result = await findAdminProperties({ page, limit, status });
  return paginatedResult(result, page, limit);
}

export async function getAdminProperty(propertyIdValue) {
  const property = await findAdminPropertyById(parseId(propertyIdValue, 'property id'));
  if (!property) throw adminError('Property not found', 404);
  return property;
}

export async function changePropertyStatus(propertyIdValue, status, adminId, rejectionReason) {
  const propertyId = parseId(propertyIdValue, 'property id');
  if (!propertyStatuses.has(status)) throw adminError('Invalid property status');
  if (status === 'rejected' && (!rejectionReason || rejectionReason.trim().length < 3)) {
    throw adminError('A rejection reason is required');
  }
  if (status !== 'rejected' && rejectionReason) throw adminError('Rejection reason is only valid for rejected properties');
  const property = await setPropertyStatus(propertyId, status, adminId, rejectionReason?.trim() || null);
  if (!property) throw adminError('Property not found', 404);
  return property;
}

export async function removeProperty(propertyIdValue) {
  const deleted = await deleteAdminProperty(parseId(propertyIdValue, 'property id'));
  if (!deleted) throw adminError('Property not found', 404);
}

export async function listReports(query) {
  const { page, limit } = pagination(query);
  let resolved;
  if (query.resolved !== undefined) {
    if (query.resolved !== 'true' && query.resolved !== 'false') throw adminError('Resolved must be true or false');
    resolved = query.resolved === 'true';
  }
  const result = await findAdminReports({ page, limit, resolved });
  return paginatedResult(result, page, limit);
}

export async function resolveReport(reportIdValue, adminId) {
  const report = await resolveAdminReport(parseId(reportIdValue, 'report id'), adminId);
  if (!report) throw adminError('Report not found', 404);
  return report;
}
