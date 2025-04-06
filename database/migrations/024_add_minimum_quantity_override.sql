-- Add position field to print_queue table
INSERT INTO schema_versions (version) VALUES (22);

-- Create a new table with the position column
CREATE TABLE print_queue_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT NOT NULL,
    printer_id INTEGER,
    color TEXT,
    status TEXT DEFAULT 'pending',
    position INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (printer_id) REFERENCES printers (id)
);

-- Copy data from the old table to the new one
-- Set initial position values based on creation date (newer items at top)
INSERT INTO print_queue_new (id, item_name, printer_id, color, status, position, created_at, updated_at)
SELECT id, item_name, printer_id, color, status, 
       (SELECT COUNT(*) FROM print_queue pq2 WHERE pq2.created_at >= pq1.created_at) - 1 as position,
       created_at, updated_at
FROM print_queue pq1
ORDER BY created_at ASC;

-- Drop the old table
DROP TABLE print_queue;

-- Rename the new table
ALTER TABLE print_queue_new RENAME TO print_queue;

-- Add an index on position for faster ordering
CREATE INDEX idx_print_queue_position ON print_queue(position); 