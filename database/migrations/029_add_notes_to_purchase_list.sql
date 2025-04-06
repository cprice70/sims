-- Add notes column to purchase_list table
ALTER TABLE purchase_list ADD COLUMN notes TEXT;

-- Update schema version
INSERT INTO schema_versions (version) VALUES (28); 