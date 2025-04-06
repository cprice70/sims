-- Create view to calculate minimum quantity based on product usage
DROP VIEW IF EXISTS filament_minimum_quantities;
CREATE VIEW filament_minimum_quantities AS
SELECT 
    f.id,
    CASE 
        WHEN f.minimum_quantity_override IS NOT NULL THEN f.minimum_quantity_override
        WHEN COUNT(pf.product_id) = 0 THEN 0
        ELSE MIN(8, 2 + (COUNT(pf.product_id) + 2) / 3)  -- This gives us min(8, 2 + ceil(count/3))
    END as calculated_minimum
FROM filaments f
LEFT JOIN product_filaments pf ON f.id = pf.filament_id
GROUP BY f.id;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS update_filament_minimum_quantity_insert;
CREATE TRIGGER update_filament_minimum_quantity_insert
AFTER INSERT ON product_filaments
BEGIN
    UPDATE filaments 
    SET minimum_quantity = (
        SELECT calculated_minimum 
        FROM filament_minimum_quantities 
        WHERE id = NEW.filament_id
    )
    WHERE id = NEW.filament_id;
END;

-- Create trigger for DELETE operations
DROP TRIGGER IF EXISTS update_filament_minimum_quantity_delete;
CREATE TRIGGER update_filament_minimum_quantity_delete
AFTER DELETE ON product_filaments
BEGIN
    UPDATE filaments 
    SET minimum_quantity = (
        SELECT calculated_minimum 
        FROM filament_minimum_quantities 
        WHERE id = OLD.filament_id
    )
    WHERE id = OLD.filament_id;
END;

-- Create trigger for minimum_quantity_override changes
DROP TRIGGER IF EXISTS update_filament_minimum_quantity_override;
CREATE TRIGGER update_filament_minimum_quantity_override
AFTER UPDATE OF minimum_quantity_override ON filaments
BEGIN
    UPDATE filaments 
    SET minimum_quantity = (
        SELECT calculated_minimum 
        FROM filament_minimum_quantities 
        WHERE id = NEW.id
    )
    WHERE id = NEW.id;
END;

-- Update existing filaments
UPDATE filaments
SET minimum_quantity = (
    SELECT calculated_minimum 
    FROM filament_minimum_quantities 
    WHERE id = filaments.id
);

-- Update schema version
INSERT INTO schema_versions (version) VALUES (23); 