-- Update products table to match API expectations
ALTER TABLE products ADD COLUMN additional_parts_cost REAL;
ALTER TABLE products ADD COLUMN list_price REAL;

-- Create product_filaments table if it doesn't exist
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
