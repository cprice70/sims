-- Add cost column to filaments
ALTER TABLE filaments ADD COLUMN cost REAL;

-- Update schema version
INSERT OR IGNORE INTO schema_versions (version) VALUES (39); 