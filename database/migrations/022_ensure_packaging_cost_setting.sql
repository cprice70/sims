-- Add packaging_cost to settings table with default value of 0.5 (50 cents)
INSERT OR REPLACE INTO settings (key, value) VALUES ('packaging_cost', '0.5');

-- Update schema version
INSERT INTO schema_versions (version) VALUES (20); 