CREATE TYPE user_role AS ENUM ('USER', 'OWNER', 'BROKER', 'ADMIN');
CREATE TYPE property_purpose AS ENUM ('sale', 'rent');
CREATE TYPE property_status AS ENUM ('pending', 'approved', 'rejected', 'sold', 'rented');
CREATE TYPE currency_code AS ENUM ('EGP');
CREATE TYPE report_reason AS ENUM ('fake_property', 'incorrect_information', 'wrong_price', 'duplicate_listing', 'inappropriate_content', 'other');

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'USER',
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE governorates (
    id BIGSERIAL PRIMARY KEY,
    name_ar VARCHAR(120) NOT NULL,
    name_en VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cities (
    id BIGSERIAL PRIMARY KEY,
    governorate_id BIGINT NOT NULL REFERENCES governorates(id) ON DELETE RESTRICT,
    name_ar VARCHAR(120) NOT NULL,
    name_en VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (governorate_id, name_en)
);

CREATE TABLE areas (
    id BIGSERIAL PRIMARY KEY,
    city_id BIGINT NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
    name_ar VARCHAR(120) NOT NULL,
    name_en VARCHAR(120) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (city_id, name_en)
);

CREATE TABLE properties (
    id BIGSERIAL PRIMARY KEY,
    owner_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    title VARCHAR(180) NOT NULL,
    description TEXT NOT NULL,
    property_type VARCHAR(40) NOT NULL CHECK (property_type IN ('apartment', 'villa', 'house', 'land', 'shop', 'office', 'commercial', 'chalet', 'warehouse', 'other')),
    purpose property_purpose NOT NULL,
    price NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
    currency currency_code NOT NULL DEFAULT 'EGP',
    area_sqm NUMERIC(12, 2) NOT NULL CHECK (area_sqm > 0),
    bedrooms SMALLINT CHECK (bedrooms IS NULL OR bedrooms >= 0),
    bathrooms SMALLINT CHECK (bathrooms IS NULL OR bathrooms >= 0),
    floor SMALLINT CHECK (floor IS NULL OR floor >= 0),
    total_floors SMALLINT CHECK (total_floors IS NULL OR total_floors > 0),
    furnished BOOLEAN NOT NULL DEFAULT FALSE,
    construction_year SMALLINT CHECK (construction_year IS NULL OR construction_year BETWEEN 1800 AND 2200),
    governorate_id BIGINT NOT NULL REFERENCES governorates(id) ON DELETE RESTRICT,
    city_id BIGINT NOT NULL REFERENCES cities(id) ON DELETE RESTRICT,
    area_id BIGINT REFERENCES areas(id) ON DELETE RESTRICT,
    address VARCHAR(255) NOT NULL,
    latitude NUMERIC(9, 6) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    longitude NUMERIC(9, 6) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    google_maps_url TEXT,
    status property_status NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    approved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (total_floors IS NULL OR floor IS NULL OR floor <= total_floors),
    CHECK ((latitude IS NULL AND longitude IS NULL) OR (latitude IS NOT NULL AND longitude IS NOT NULL))
);

CREATE TABLE property_images (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    cloudinary_public_id TEXT,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes INTEGER NOT NULL CHECK (file_size_bytes > 0),
    display_order INTEGER NOT NULL DEFAULT 0 CHECK (display_order >= 0),
    is_main BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE property_features (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    feature_name VARCHAR(80) NOT NULL,
    feature_value VARCHAR(255),
    UNIQUE (property_id, feature_name)
);

CREATE TABLE favorites (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, property_id)
);

CREATE TABLE property_views (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    receiver_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (length(trim(message)) > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    CHECK (sender_id <> receiver_id)
);

CREATE TABLE property_reports (
    id BIGSERIAL PRIMARY KEY,
    property_id BIGINT NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    reporter_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason report_reason NOT NULL,
    details TEXT,
    resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (property_id, reporter_id, reason)
);

CREATE INDEX idx_properties_public_search ON properties (status, purpose, property_type, city_id, price, area_sqm);
CREATE INDEX idx_properties_filter_ranges ON properties (status, price, area_sqm, bedrooms, bathrooms, furnished);
CREATE INDEX idx_properties_location ON properties (governorate_id, city_id, area_id);
CREATE INDEX idx_properties_owner ON properties (owner_id, status);
CREATE INDEX idx_properties_created_at ON properties (created_at DESC);
CREATE INDEX idx_property_images_property ON property_images (property_id, display_order);
CREATE UNIQUE INDEX idx_one_main_image_per_property ON property_images (property_id) WHERE is_main = TRUE;
CREATE INDEX idx_favorites_user ON favorites (user_id, created_at DESC);
CREATE INDEX idx_views_property ON property_views (property_id, viewed_at DESC);
CREATE INDEX idx_messages_receiver ON messages (receiver_id, read_at, created_at DESC);
CREATE INDEX idx_messages_sender ON messages (sender_id, created_at DESC);
CREATE INDEX idx_reports_status ON property_reports (resolved, created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER properties_set_updated_at
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
