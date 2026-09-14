import {
  createProperty,
  deleteProperty,
  findPropertiesByOwner,
  findPropertyByIdForOwner,
  findPublicProperties,
  findPublicPropertyById,
  recordPropertyView,
  updateProperty
} from '../models/property.model.js';

const propertyTypes = new Set(['apartment', 'villa', 'house', 'land', 'shop', 'office', 'commercial', 'chalet', 'warehouse', 'other']);
const purposes = new Set(['sale', 'rent']);
const currencies = new Set(['EGP']);
const sortOptions = {
  newest: 'p.created_at DESC',
  oldest: 'p.created_at ASC',
  price_asc: 'p.price ASC',
  price_desc: 'p.price DESC',
  area_asc: 'p.area_sqm ASC',
  area_desc: 'p.area_sqm DESC',
  price_low_to_high: 'p.price ASC',
  price_high_to_low: 'p.price DESC',
  area_low_to_high: 'p.area_sqm ASC',
  area_high_to_low: 'p.area_sqm DESC'
};

function normalizePropertyType(value) {
  return value === undefined || value === null ? undefined : String(value).trim().toLowerCase();
}

function propertyError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function optionalNumber(value, field, { integer = false, min = 0 } = {}) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || (integer && !Number.isInteger(parsed))) {
    throw propertyError(`${field} must be a valid ${integer ? 'whole ' : ''}number`);
  }
  return parsed;
}

function requiredNumber(value, field, options) {
  const parsed = optionalNumber(value, field, options);
  if (parsed === null) throw propertyError(`${field} is required`);
  return parsed;
}

function optionalBoolean(value, field) {
  if (value === undefined || value === null || value === '') return false;
  if (value === true || value === false) return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  throw propertyError(`${field} must be a boolean`);
}

function queryBoolean(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === 'true' || value === '1' || value === true) return true;
  if (value === 'false' || value === '0' || value === false) return false;
  throw propertyError(`${field} must be true or false`);
}

function normalizePropertyInput(input) {
  const normalizeContactPhone = (value, field) => {
    const phone = value === undefined || value === null || value === '' ? null : String(value).trim();
    if (phone !== null && !/^01[0125]\d{8}$/.test(phone)) throw propertyError(`${field} must be a valid Egyptian mobile number`);
    return phone;
  };
  const property = {
    title: String(input.title || '').trim(),
    description: String(input.description || '').trim(),
    propertyType: normalizePropertyType(input.property_type || input.propertyType) || '',
    purpose: String(input.purpose || '').toLowerCase(),
    currency: String(input.currency || 'EGP').toUpperCase(),
    address: String(input.address || '').trim() || null,
    furnished: optionalBoolean(input.furnished, 'furnished'),
    areaSqm: requiredNumber(input.area_sqm ?? input.area, 'area', { min: 0.01 }),
    price: requiredNumber(input.price, 'price', { min: 0 }),
    bedrooms: optionalNumber(input.bedrooms, 'bedrooms', { integer: true }),
    bathrooms: optionalNumber(input.bathrooms, 'bathrooms', { integer: true }),
    floor: optionalNumber(input.floor, 'floor', { integer: true }),
    constructionYear: optionalNumber(input.construction_year ?? input.constructionYear, 'construction_year', { integer: true, min: 1800 }),
    governorateId: requiredNumber(input.governorate_id ?? input.governorateId, 'governorate_id', { integer: true, min: 1 }),
    cityId: requiredNumber(input.city_id ?? input.cityId, 'city_id', { integer: true, min: 1 }),
    latitude: optionalNumber(input.latitude, 'latitude', { min: -90 }),
    longitude: optionalNumber(input.longitude, 'longitude', { min: -180 })
    , contactPhone: normalizeContactPhone(input.contact_phone, 'contact_phone')
    , whatsappPhone: normalizeContactPhone(input.whatsapp_phone, 'whatsapp_phone')
  };

  if (property.title.length < 5 || property.title.length > 180) throw propertyError('Title must be between 5 and 180 characters');
  if (!property.description) throw propertyError('Description is required');
  if (!propertyTypes.has(property.propertyType)) throw propertyError('Invalid property type');
  if (!purposes.has(property.purpose)) throw propertyError('Purpose must be sale or rent');
  if (!currencies.has(property.currency)) throw propertyError('Unsupported currency');
  if ((property.latitude === null) !== (property.longitude === null)) throw propertyError('Latitude and longitude must be provided together');
  if (property.constructionYear !== null && property.constructionYear > new Date().getFullYear() + 1) throw propertyError('Invalid construction year');

  return property;
}

function parseId(value, field = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw propertyError(`Invalid ${field}`, 400);
  return id;
}

export async function listPublicProperties(query) {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(query.limit || 12)));
  if (!Number.isInteger(page) || !Number.isInteger(limit)) throw propertyError('Page and limit must be whole numbers');

  const filters = {
    keyword: query.keyword ? String(query.keyword).trim() : undefined,
    purpose: query.purpose,
    propertyType: normalizePropertyType(query.type || query.property_type),
    cityId: query.cityId ? parseId(query.cityId, 'cityId') : undefined,
    governorateId: query.governorateId ? parseId(query.governorateId, 'governorateId') : undefined,
    governorateName: query.governorate ? `%${String(query.governorate).trim()}%` : undefined,
    cityName: query.city ? `%${String(query.city).trim()}%` : undefined,
    minPrice: query.minPrice === undefined ? undefined : requiredNumber(query.minPrice, 'minPrice', { min: 0 }),
    maxPrice: query.maxPrice === undefined ? undefined : requiredNumber(query.maxPrice, 'maxPrice', { min: 0 }),
    minArea: query.minArea === undefined ? undefined : requiredNumber(query.minArea, 'minArea', { min: 0 }),
    maxArea: query.maxArea === undefined ? undefined : requiredNumber(query.maxArea, 'maxArea', { min: 0 }),
    bedrooms: query.bedrooms === undefined ? undefined : requiredNumber(query.bedrooms, 'bedrooms', { integer: true, min: 0 }),
    bathrooms: query.bathrooms === undefined ? undefined : requiredNumber(query.bathrooms, 'bathrooms', { integer: true, min: 0 }),
    furnished: queryBoolean(query.furnished, 'furnished')
  };
  if (filters.purpose && !purposes.has(filters.purpose)) throw propertyError('Invalid purpose filter');
  if (filters.propertyType && !propertyTypes.has(filters.propertyType)) throw propertyError('Invalid property type filter');
  if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) throw propertyError('Minimum price cannot exceed maximum price');
  if (filters.minArea !== undefined && filters.maxArea !== undefined && filters.minArea > filters.maxArea) throw propertyError('Minimum area cannot exceed maximum area');
  if (filters.keyword !== undefined && (filters.keyword.length < 2 || filters.keyword.length > 100)) throw propertyError('Keyword must be between 2 and 100 characters');
  if (filters.governorateName === '%%' || filters.cityName === '%%') throw propertyError('Location filter cannot be empty');

  const result = await findPublicProperties({ page, limit, filters, sort: sortOptions[query.sort] || sortOptions.newest });
  return {
    data: result.rows,
    pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) }
  };
}

export async function getPublicProperty(
  id,
  viewer: { userId?: number | string | null; ipAddress?: string | null } = {}
) {
  const propertyId = parseId(id);
  const property = await findPublicPropertyById(propertyId);
  if (!property) throw propertyError('Property not found', 404);
  const viewRecorded = await recordPropertyView(propertyId, {
    userId: viewer.userId || null,
    ipAddress: viewer.ipAddress || null
  });
  if (viewRecorded) property.view_count = Number(property.view_count || 0) + 1;
  return property;
}

export async function getOwnerProperties(ownerId) {
  return findPropertiesByOwner(ownerId);
}

export async function getOwnerProperty(id, ownerId) {
  const property = await findPropertyByIdForOwner(parseId(id), ownerId);
  if (!property) throw propertyError('Property not found', 404);
  return property;
}

export async function createOwnerProperty(ownerId, input) {
  return createProperty({ ownerId, ...normalizePropertyInput(input) });
}

export async function updateOwnerProperty(id, ownerId, input) {
  const property = await updateProperty(parseId(id), ownerId, normalizePropertyInput(input));
  if (!property) throw propertyError('Property not found', 404);
  return property;
}

export async function deleteOwnerProperty(id, ownerId) {
  const deleted = await deleteProperty(parseId(id), ownerId);
  if (!deleted) throw propertyError('Property not found', 404);
}
