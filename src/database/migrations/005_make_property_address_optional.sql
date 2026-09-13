-- The map coordinates are now the source of truth for a property's location.
ALTER TABLE properties
  ALTER COLUMN address DROP NOT NULL;
