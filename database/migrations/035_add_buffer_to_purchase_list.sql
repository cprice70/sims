-- Drop and recreate the view with updated minimum quantity calculation
DROP VIEW IF EXISTS filament_minimum_quantities;
CREATE VIEW filament_minimum_quantities AS
SELECT 
    f.id,
    f.name,
    f.material,
    f.color,
    f.manufacturer,
    CASE 
        WHEN f.minimum_quantity_override IS NOT NULL THEN f.minimum_quantity_override
        WHEN COUNT(pf.product_id) = 0 THEN 0
        ELSE MIN(8, 2 + COUNT(pf.product_id) / 2)  -- This gives us min(8, 2 + floor(count/2))
    END as minimum_quantity,
    f.quantity as current_quantity,
    MAX(0, CASE 
        WHEN f.minimum_quantity_override IS NOT NULL THEN f.minimum_quantity_override
        WHEN COUNT(pf.product_id) = 0 THEN 0
        ELSE MIN(8, 2 + COUNT(pf.product_id) / 2)  -- This gives us min(8, 2 + floor(count/2))
    END - f.quantity + 2) as needed_quantity  -- Added buffer of 2 units
FROM filaments f
LEFT JOIN product_filaments pf ON f.id = pf.filament_id
GROUP BY f.id;

-- Update existing filaments to trigger the purchase list population
UPDATE filaments 
SET minimum_quantity_override = minimum_quantity_override;

-- Update schema version
INSERT OR IGNORE INTO schema_versions (version) VALUES (35); 