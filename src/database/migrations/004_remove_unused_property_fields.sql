BEGIN;

ALTER TABLE properties
  DROP COLUMN IF EXISTS area_id,
  DROP COLUMN IF EXISTS total_floors,
  DROP COLUMN IF EXISTS google_maps_url;

COMMIT;
