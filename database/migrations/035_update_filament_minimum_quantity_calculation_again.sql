-- Drop and recreate the view with updated minimum quantity calculation
DROP VIEW IF EXISTS filament_minimum_quantities;
CREATE VIEW filament_minimum_quantities AS
SELECT 
    f.id,
    CASE 
        WHEN f.minimum_quantity_override IS NOT NULL THEN f.minimum_quantity_override
        WHEN COUNT(pf.product_id) = 0 THEN 0
        ELSE MIN(8, 2 + (COUNT(pf.product_id) + 2) / 2)  -- This gives us min(8, 2 + ceil(count/2))
    END as calculated_minimum
FROM filaments f
LEFT JOIN product_filaments pf ON f.id = pf.filament_id
GROUP BY f.id;

-- Update existing filaments
UPDATE filaments
SET minimum_quantity = (
    SELECT calculated_minimum 
    FROM filament_minimum_quantities 
    WHERE id = filaments.id
);

-- Update schema version
INSERT INTO schema_versions (version) VALUES (33); 