-- Add position column to print_queue for ordering
INSERT INTO schema_versions (version) VALUES (44);

-- Add the position column, defaulting to 0 for new rows
ALTER TABLE print_queue ADD COLUMN position INTEGER DEFAULT 0;

-- Update existing rows with a sequential position based on ID
-- Use a temporary update mechanism for SQLite versions that don't support ROW_NUMBER() directly in UPDATE
-- This assumes IDs are generally sequential, providing a basic initial order.
UPDATE print_queue
SET position = (
    SELECT COUNT(*) 
    FROM print_queue p2 
    WHERE p2.id <= print_queue.id
) - 1;

-- Add an index for faster ordering
CREATE INDEX idx_print_queue_position ON print_queue (position);
