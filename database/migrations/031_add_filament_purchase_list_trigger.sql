-- Force update all filaments to trigger the purchase list population
UPDATE filaments 
SET minimum_quantity_override = minimum_quantity_override;

-- Update schema version
INSERT OR IGNORE INTO schema_versions (version) VALUES (29); 