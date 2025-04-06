-- Add ordered column to purchase_list table
ALTER TABLE purchase_list ADD COLUMN ordered BOOLEAN DEFAULT 0;

-- Update schema version if it doesn't exist
INSERT OR IGNORE INTO schema_versions (version) VALUES (31); 