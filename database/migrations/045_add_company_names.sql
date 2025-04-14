-- Add company names to settings
INSERT OR REPLACE INTO settings (key, value) VALUES ('company_name_1', 'Super Fantastic');
INSERT OR REPLACE INTO settings (key, value) VALUES ('company_name_2', 'Cedar & Sail');

-- Update schema version
INSERT OR REPLACE INTO schema_versions (version) VALUES (45);
