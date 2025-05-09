-- Drop and recreate the view with rounded minimum quantity calculation
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
        ELSE MIN(8, ROUND(2 + SUM(pf.filament_usage_amount) / 1000))  -- Convert grams to kg, round to nearest whole number, and cap at 8 spools
    END as minimum_quantity,
    f.quantity as current_quantity,
    MAX(0, CASE 
        WHEN f.minimum_quantity_override IS NOT NULL THEN f.minimum_quantity_override
        WHEN COUNT(pf.product_id) = 0 THEN 0
        ELSE MIN(8, ROUND(2 + SUM(pf.filament_usage_amount) / 1000))  -- Convert grams to kg, round to nearest whole number, and cap at 8 spools
    END - f.quantity) as base_needed_quantity,
    CASE 
        WHEN f.minimum_quantity_override IS NOT NULL AND f.minimum_quantity_override = 0 THEN 0
        WHEN COUNT(pf.product_id) = 0 THEN 0
        ELSE MAX(0, CASE 
            WHEN f.minimum_quantity_override IS NOT NULL THEN f.minimum_quantity_override
            WHEN COUNT(pf.product_id) = 0 THEN 0
            ELSE MIN(8, ROUND(2 + SUM(pf.filament_usage_amount) / 1000))  -- Convert grams to kg, round to nearest whole number, and cap at 8 spools
        END - f.quantity + 2)  -- Only add buffer if we need to reorder
    END as needed_quantity
FROM filaments f
LEFT JOIN product_filaments pf ON f.id = pf.filament_id
GROUP BY f.id;

-- Update existing filaments to trigger the purchase list population
UPDATE filaments 
SET minimum_quantity = (
    SELECT minimum_quantity 
    FROM filament_minimum_quantities 
    WHERE id = filaments.id
);

-- Force update all filaments to trigger the purchase list population
UPDATE filaments 
SET minimum_quantity_override = minimum_quantity_override;

-- Update schema version
INSERT OR IGNORE INTO schema_versions (version) VALUES (43); 