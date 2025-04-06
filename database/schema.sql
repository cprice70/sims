-- This file represents the latest schema version
-- For new installations, all migrations will be run in order

-- Include initial schema and core table creation
.read migrations/001_initial_schema.sql 
.read migrations/005_add_printers_and_queue.sql
.read migrations/007_add_purchase_list.sql
.read migrations/009_add_parts.sql
.read migrations/011_add_part_printers_junction.sql
.read migrations/013_add_products.sql
.read migrations/014_add_settings.sql
.read migrations/018_add_product_filaments.sql

-- Include important schema modifications
.read migrations/021_update_time_fields_to_real.sql
.read migrations/041_fix_packaging_cost_default.sql 