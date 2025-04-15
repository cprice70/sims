-- Fix missing products table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    business TEXT,
    filament_used REAL,
    print_prep_time INTEGER,
    post_processing_time INTEGER,
    additional_parts_cost REAL,
    list_price REAL,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create product_filaments junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_filaments (
    product_id INTEGER NOT NULL,
    filament_id INTEGER NOT NULL,
    filament_usage_amount REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id, filament_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (filament_id) REFERENCES filaments(id) ON DELETE CASCADE
);
