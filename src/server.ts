import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { Database, open } from 'sqlite';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { body, param, validationResult, ValidationChain } from 'express-validator';
import { sanitizeHtml, sanitizeUrl, validateNumber } from './utils/sanitize';

const app = express();

// Configure CORS with specific allowed origins instead of allowing all origins
const allowedOrigins = [
  'http://localhost:5173',   // Frontend dev server
  'http://localhost:8175',   // Backend dev server
  'http://homeserver.local:5173',  // Production frontend
  'http://homeserver.local:8175',  // Production backend
];

// Custom CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('The CORS policy for this site does not allow access from the specified origin.'), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}));

app.use(express.json());

// Middleware to handle validation errors
const validate = (validations: ValidationChain[]) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

// Database paths relative to project root
const DB_PATH = join(process.cwd(), 'db', 'filaments.db');
const SCHEMA_PATH = join(process.cwd(), 'database', 'schema.sql');
const MIGRATIONS_PATH = join(process.cwd(), 'database', 'migrations');

let db: Database;

async function initializeDatabase() {
  try {
    await fs.mkdir(dirname(DB_PATH), { recursive: true });
    
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });

    const tableExists = await db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='filaments'"
    );

    if (!tableExists) {
      // Embed initial schema as fallback
      const initialSchema = `
        CREATE TABLE IF NOT EXISTS schema_versions (
            version INTEGER PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        INSERT INTO schema_versions (version) VALUES (1);
        CREATE TABLE IF NOT EXISTS filaments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            material TEXT NOT NULL,
            color TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            manufacturer TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await db.exec(initialSchema);
      console.log('Database initialized with embedded schema');
    }

    await runMigrations(db);
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

async function runMigrations(db: Database) {
    try {
        // Ensure migrations directory exists
        await fs.mkdir(MIGRATIONS_PATH, { recursive: true });
        
        // Get list of migrations, or empty array if none exist
        let migrations = [];
        try {
            migrations = await fs.readdir(MIGRATIONS_PATH);
            console.log('Found migrations:', migrations);
        } catch (error) {
            console.log('No migrations found, continuing with initialization');
            return;
        }
        
        // Get current schema version
        await db.run(`CREATE TABLE IF NOT EXISTS schema_versions (
            version INTEGER PRIMARY KEY,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        
        const currentVersion = await db.get('SELECT MAX(version) as version FROM schema_versions');
        const dbVersion = currentVersion?.version || 0;
        console.log('Current database version:', dbVersion);
        
        // Sort migrations numerically
        const pendingMigrations = migrations
            .filter(f => f.endsWith('.sql'))
            .sort((a, b) => {
                const vA = parseInt(a.split('_')[0]);
                const vB = parseInt(b.split('_')[0]);
                return vA - vB;
            })
            .filter(f => parseInt(f.split('_')[0]) > dbVersion);

        console.log('Pending migrations:', pendingMigrations);

        // Run pending migrations in order
        for (const migration of pendingMigrations) {
            console.log(`Running migration: ${migration}`);
            const sql = await fs.readFile(join(MIGRATIONS_PATH, migration), 'utf8');
            await db.exec(sql);
            console.log(`Applied migration: ${migration}`);
        }
    } catch (error) {
        console.error('Migration error:', error);
        // Don't exit process, allow initialization to continue
    }
}

// Initialize database before starting the server
initializeDatabase().then(() => {
    const port = process.env.PORT || 8175;
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
});

// API Routes
app.get('/api/filaments', async (req, res) => {
    try {
        const filaments = await db.all('SELECT * FROM filaments ORDER BY created_at DESC');
        res.json(filaments);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch filaments' });
    }
});

app.get('/api/manufacturers', async (req, res) => {
    try {
        const manufacturers = await db.all(
            'SELECT DISTINCT manufacturer FROM filaments WHERE manufacturer IS NOT NULL AND manufacturer != "" ORDER BY manufacturer'
        );
        res.json(manufacturers.map((m: { manufacturer: string }) => m.manufacturer));
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch manufacturers' });
    }
});

// Validation rules for filaments
const filamentValidationRules = [
    body('name').trim().isLength({ min: 1 }).withMessage('Name is required')
        .customSanitizer(value => sanitizeHtml(value)),
    body('material').trim().isLength({ min: 1 }).withMessage('Material is required')
        .customSanitizer(value => sanitizeHtml(value)),
    body('color').trim().isLength({ min: 1 }).withMessage('Color is required')
        .customSanitizer(value => sanitizeHtml(value)),
    body('color2').optional({ nullable: true }).trim()
        .customSanitizer(value => sanitizeHtml(value)),
    body('color3').optional({ nullable: true }).trim()
        .customSanitizer(value => sanitizeHtml(value)),
    body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number')
        .toInt(),
    body('minimum_quantity').optional({ nullable: true }).isInt({ min: 0 })
        .withMessage('Minimum quantity must be a positive number').toInt(),
    body('manufacturer').optional({ nullable: true }).trim()
        .customSanitizer(value => sanitizeHtml(value)),
    body('notes').optional({ nullable: true }).trim()
        .customSanitizer(value => sanitizeHtml(value)),
    body('cost').optional({ nullable: true }).isFloat({ min: 0 })
        .withMessage('Cost must be a positive number').toFloat()
];

app.post('/api/filaments', validate(filamentValidationRules), async (req, res) => {
    try {
        const {
            name,
            material,
            color,
            color2,
            color3,
            quantity,
            minimum_quantity,
            manufacturer,
            notes,
            cost
        } = req.body;

        const result = await db.run(
            `INSERT INTO filaments (
                name, material, color, color2, color3, quantity,
                minimum_quantity, manufacturer, notes, cost
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, material, color, color2, color3, quantity, minimum_quantity, manufacturer, notes, cost]
        );

        const newFilament = await db.get('SELECT * FROM filaments WHERE id = ?', result.lastID);
        res.status(201).json(newFilament);
    } catch (error) {
        console.error('Error creating filament:', error);
        res.status(500).json({ error: 'Failed to create filament' });
    }
});

app.put('/api/filaments/:id', validate([
    param('id').isInt().withMessage('Invalid filament ID').toInt(),
    ...filamentValidationRules
]), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        delete updates.id;  // Remove id from updates
        delete updates.created_at;  // Remove created_at from updates
        updates.updated_at = new Date().toISOString();

        // Define allowed fields to prevent SQL injection
        const allowedFields = [
            'name', 'material', 'color', 'color2', 'color3', 
            'quantity', 'minimum_quantity', 'manufacturer', 
            'notes', 'cost', 'updated_at'
        ];
        
        // Filter out any fields that aren't in the allowed list
        const validUpdates = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {} as Record<string, any>);
            
        if (Object.keys(validUpdates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        // Create parameterized query with only valid fields
        const fields = Object.keys(validUpdates);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => validUpdates[field]);

        await db.run(
            `UPDATE filaments SET ${setClause} WHERE id = ?`,
            [...values, id]
        );

        const updatedFilament = await db.get('SELECT * FROM filaments WHERE id = ?', id);
        if (!updatedFilament) {
            return res.status(404).json({ error: 'Filament not found' });
        }
        res.json(updatedFilament);
    } catch (error) {
        console.error('Error updating filament:', error);
        res.status(500).json({ error: 'Failed to update filament' });
    }
});

app.delete('/api/filaments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.run('DELETE FROM filaments WHERE id = ?', id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete filament' });
    }
});

// Printer Routes
app.get('/api/printers', async (req, res) => {
    try {
        const printers = await db.all('SELECT * FROM printers ORDER BY name');
        res.json(printers);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch printers' });
    }
});

// Validation rules for printers
const printerValidationRules = [
    body('name').trim().isLength({ min: 1 }).withMessage('Name is required')
        .customSanitizer(value => sanitizeHtml(value))
];

app.post('/api/printers', validate(printerValidationRules), async (req, res) => {
    try {
        const { name } = req.body;
        const result = await db.run(
            'INSERT INTO printers (name) VALUES (?)',
            [name]
        );
        const newPrinter = await db.get('SELECT * FROM printers WHERE id = ?', result.lastID);
        res.status(201).json(newPrinter);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create printer' });
    }
});

app.put('/api/printers/:id', validate([
    param('id').isInt().withMessage('Invalid printer ID').toInt(),
    ...printerValidationRules
]), async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        await db.run(
            'UPDATE printers SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [name, id]
        );
        const updatedPrinter = await db.get('SELECT * FROM printers WHERE id = ?', id);
        if (!updatedPrinter) {
            return res.status(404).json({ error: 'Printer not found' });
        }
        res.json(updatedPrinter);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update printer' });
    }
});

app.delete('/api/printers/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.run('DELETE FROM printers WHERE id = ?', id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete printer' });
    }
});

// Print Queue Routes
app.get('/api/print-queue', async (req, res) => {
    try {
        const items = await db.all(`
            SELECT q.*, p.name as printer_name 
            FROM print_queue q 
            LEFT JOIN printers p ON q.printer_id = p.id 
            ORDER BY q.position ASC
        `);
        
        // Transform the results to match the frontend type
        const formattedItems = items.map(item => ({
            ...item,
            printer: item.printer_name ? {
                id: item.printer_id,
                name: item.printer_name
            } : undefined
        }));
        
        res.json(formattedItems);
    } catch (error) {
        console.error('Error fetching print queue:', error); // Log the specific error
        res.status(500).json({ error: 'Failed to fetch print queue' });
    }
});

// Validation rules for print queue items
const printQueueValidationRules = [
    body('item_name').trim().isLength({ min: 1 }).withMessage('Item name is required')
        .customSanitizer(value => sanitizeHtml(value)),
    body('printer_id').optional({ nullable: true }).isInt().withMessage('Printer ID must be a number')
        .toInt(),
    body('color').optional({ nullable: true }).trim()
        .customSanitizer(value => sanitizeHtml(value)),
    body('status').optional().isIn(['pending', 'printing', 'completed', 'canceled'])
        .withMessage('Status must be one of: pending, printing, completed, canceled')
        .default('pending')
];

app.post('/api/print-queue', validate(printQueueValidationRules), async (req, res) => {
    try {
        const { item_name, printer_id, color, status = 'pending' } = req.body;
        
        // Get the maximum position value to add new items at the top
        const maxPositionResult = await db.get('SELECT MAX(position) as maxPosition FROM print_queue');
        const position = maxPositionResult.maxPosition !== null ? maxPositionResult.maxPosition + 1 : 0;
        
        const result = await db.run(
            'INSERT INTO print_queue (item_name, printer_id, color, status, position) VALUES (?, ?, ?, ?, ?)',
            [item_name, printer_id, color, status, position]
        );
        
        const newItem = await db.get(`
            SELECT q.*, p.name as printer_name 
            FROM print_queue q 
            LEFT JOIN printers p ON q.printer_id = p.id 
            WHERE q.id = ?
        `, result.lastID);
        
        // Transform to match frontend type
        const formattedItem = {
            ...newItem,
            printer: newItem.printer_name ? {
                id: newItem.printer_id,
                name: newItem.printer_name
            } : undefined
        };
        
        res.status(201).json(formattedItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create print queue item' });
    }
});

app.put('/api/print-queue/:id', validate([
    param('id').isInt().withMessage('Invalid queue item ID').toInt(),
    ...printQueueValidationRules
]), async (req, res) => {
    try {
        const { id } = req.params;
        const { item_name, printer_id, color, status } = req.body;
        
        await db.run(
            `UPDATE print_queue 
             SET item_name = ?, printer_id = ?, color = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [item_name, printer_id, color, status, id]
        );
        
        const updatedItem = await db.get(`
            SELECT q.*, p.name as printer_name 
            FROM print_queue q 
            LEFT JOIN printers p ON q.printer_id = p.id 
            WHERE q.id = ?
        `, id);
        
        if (!updatedItem) {
            return res.status(404).json({ error: 'Print queue item not found' });
        }
        
        // Transform to match frontend type
        const formattedItem = {
            ...updatedItem,
            printer: updatedItem.printer_name ? {
                id: updatedItem.printer_id,
                name: updatedItem.printer_name
            } : undefined
        };
        
        res.json(formattedItem);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update print queue item' });
    }
});

app.delete('/api/print-queue/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.run('DELETE FROM print_queue WHERE id = ?', id);
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete print queue item' });
    }
});

// New endpoint for reordering print queue items
app.post('/api/print-queue/reorder', validate([
    body('items').isArray().withMessage('Items must be an array'),
    body('items.*.id').isInt().withMessage('Item ID must be a number').toInt(),
]), async (req, res) => {
    try {
        const { items } = req.body;
        
        if (!Array.isArray(items)) {
            return res.status(400).json({ error: 'Items must be an array' });
        }
        
        // Verify that all items exist before reordering
        await db.run('BEGIN TRANSACTION');
        
        for (const item of items) {
            const exists = await db.get('SELECT 1 FROM print_queue WHERE id = ?', item.id);
            if (!exists) {
                await db.run('ROLLBACK');
                return res.status(400).json({ error: `Item with ID ${item.id} does not exist` });
            }
        }
        
        // Update positions in a transaction
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            await db.run(
                'UPDATE print_queue SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [i, item.id]
            );
        }
        
        await db.run('COMMIT');
        
        // Get updated items
        const updatedItems = await db.all(`
            SELECT q.*, p.name as printer_name 
            FROM print_queue q 
            LEFT JOIN printers p ON q.printer_id = p.id 
            ORDER BY q.position ASC
        `);
        
        // Transform the results to match the frontend type
        const formattedItems = updatedItems.map(item => ({
            ...item,
            printer: item.printer_name ? {
                id: item.printer_id,
                name: item.printer_name
            } : undefined
        }));
        
        res.json(formattedItems);
    } catch (error) {
        await db.run('ROLLBACK');
        res.status(500).json({ error: 'Failed to reorder print queue items' });
    }
});

// Purchase List Routes
app.get('/api/purchase-list', async (req, res) => {
  try {
    const items = await db.all(`
      SELECT pl.*, f.name, f.material, f.color, f.manufacturer
      FROM purchase_list pl
      JOIN filaments f ON pl.filament_id = f.id
      ORDER BY pl.created_at DESC
    `)
    res.json(items)
  } catch (error) {
    console.error('Error fetching purchase list:', error)
    res.status(500).json({ error: 'Failed to fetch purchase list' })
  }
})

// Validation rules for purchase list items
const purchaseListValidationRules = [
  body('filament_id').isInt().withMessage('Filament ID must be a valid number').toInt(),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive number').toInt(),
  body('notes').optional({ nullable: true }).trim()
    .customSanitizer(value => sanitizeHtml(value)),
  body('purchased').optional().isBoolean().withMessage('Purchased must be a boolean value')
];

app.post('/api/purchase-list', validate(purchaseListValidationRules), async (req, res) => {
  const { filament_id, quantity } = req.body
  try {
    // Verify filament exists
    const filamentExists = await db.get('SELECT 1 FROM filaments WHERE id = ?', filament_id);
    if (!filamentExists) {
      return res.status(400).json({ error: 'Filament not found' });
    }
    
    const result = await db.run(
      'INSERT INTO purchase_list (filament_id, quantity) VALUES (?, ?)',
      [filament_id, quantity]
    )
    const item = await db.get(`
      SELECT pl.*, f.name, f.material, f.color, f.manufacturer
      FROM purchase_list pl
      JOIN filaments f ON pl.filament_id = f.id
      WHERE pl.id = ?
    `, result.lastID)
    res.status(201).json(item)
  } catch (error) {
    console.error('Error adding purchase list item:', error)
    res.status(500).json({ error: 'Failed to add purchase list item' })
  }
})

app.put('/api/purchase-list/:id', validate([
    param('id').isInt().withMessage('Invalid purchase list item ID').toInt(),
    ...purchaseListValidationRules
]), async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        
        // Remove fields we don't want to update
        delete updates.id;
        delete updates.created_at;
        delete updates.updated_at;
        delete updates.filament;  // Remove the nested filament object
        delete updates.name;      // Remove filament fields
        delete updates.material;
        delete updates.color;
        delete updates.manufacturer;
        
        updates.updated_at = new Date().toISOString();

        // Define allowed fields to prevent SQL injection
        const allowedFields = [
            'filament_id', 'quantity', 'purchased', 'updated_at', 'notes'
        ];
        
        // Filter out any fields that aren't in the allowed list
        const validUpdates = Object.keys(updates)
            .filter(key => allowedFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = updates[key];
                return obj;
            }, {} as Record<string, any>);
            
        if (Object.keys(validUpdates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        // If updating filament_id, verify the filament exists
        if (validUpdates.filament_id) {
            const filamentExists = await db.get('SELECT 1 FROM filaments WHERE id = ?', validUpdates.filament_id);
            if (!filamentExists) {
                return res.status(400).json({ error: 'Filament not found' });
            }
        }

        // Create parameterized query with only valid fields
        const fields = Object.keys(validUpdates);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => validUpdates[field]);

        await db.run(
            `UPDATE purchase_list SET ${setClause} WHERE id = ?`,
            [...values, id]
        );

        // Get the updated item with filament details
        const updatedItem = await db.get(`
            SELECT pl.*, f.name, f.material, f.color, f.color2, f.color3, f.manufacturer
            FROM purchase_list pl
            JOIN filaments f ON pl.filament_id = f.id
            WHERE pl.id = ?
        `, id);

        if (!updatedItem) {
            return res.status(404).json({ error: 'Purchase list item not found' });
        }
        res.json(updatedItem);
    } catch (error) {
        console.error('Error updating purchase list item:', error);
        res.status(500).json({ error: 'Failed to update purchase list item' });
    }
});

app.delete('/api/purchase-list/:id', async (req, res) => {
  const { id } = req.params
  try {
    await db.run('DELETE FROM purchase_list WHERE id = ?', id)
    res.status(204).send()
  } catch (error) {
    console.error('Error deleting purchase list item:', error)
    res.status(500).json({ error: 'Failed to delete purchase list item' })
  }
})

// Parts Routes
app.get('/api/parts', async (req, res) => {
  try {
    // Get all parts
    const parts = await db.all(`
      SELECT * FROM parts
      ORDER BY name
    `);
    
    // For each part, get its associated printers
    const formattedParts = await Promise.all(parts.map(async (part) => {
      const printers = await db.all(`
        SELECT pr.id, pr.name
        FROM printers pr
        JOIN part_printers pp ON pr.id = pp.printer_id
        WHERE pp.part_id = ?
        ORDER BY pr.name
      `, part.id);
      
      return {
        ...part,
        printers: printers.length > 0 ? printers : []
      };
    }));
    
    res.json(formattedParts);
  } catch (error) {
    console.error('Error fetching parts:', error);
    res.status(500).json({ error: 'Failed to fetch parts' });
  }
});

app.get('/api/parts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const part = await db.get(`
      SELECT * FROM parts
      WHERE id = ?
    `, id);
    
    if (!part) {
      return res.status(404).json({ error: 'Part not found' });
    }
    
    // Get associated printers for this part
    const printers = await db.all(`
      SELECT pr.id, pr.name
      FROM printers pr
      JOIN part_printers pp ON pr.id = pp.printer_id
      WHERE pp.part_id = ?
      ORDER BY pr.name
    `, id);
    
    // Transform to match frontend type
    const formattedPart = {
      ...part,
      printers: printers.length > 0 ? printers : []
    };
    
    res.json(formattedPart);
  } catch (error) {
    console.error('Error fetching part:', error);
    res.status(500).json({ error: 'Failed to fetch part' });
  }
});

// Validation rules for parts
const partValidationRules = [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required')
    .customSanitizer(value => sanitizeHtml(value)),
  body('description').optional({ nullable: true }).trim()
    .customSanitizer(value => sanitizeHtml(value)),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive number')
    .toInt(),
  body('minimum_quantity').optional({ nullable: true }).isInt({ min: 0 })
    .withMessage('Minimum quantity must be a positive number').toInt(),
  body('printer_ids').optional().isArray().withMessage('Printer IDs must be an array'),
  body('printer_ids.*').isInt().withMessage('Printer ID must be a number').toInt(),
  body('supplier').optional({ nullable: true }).trim()
    .customSanitizer(value => sanitizeHtml(value)),
  body('part_number').optional({ nullable: true }).trim()
    .customSanitizer(value => sanitizeHtml(value)),
  body('price').optional({ nullable: true }).isFloat({ min: 0 })
    .withMessage('Price must be a positive number').toFloat(),
  body('link').optional({ nullable: true }).trim()
    .customSanitizer(value => sanitizeUrl(value)),
  body('notes').optional({ nullable: true }).trim()
    .customSanitizer(value => sanitizeHtml(value))
];

app.post('/api/parts', validate(partValidationRules), async (req, res) => {
  try {
    const {
      name,
      description,
      quantity,
      minimum_quantity,
      printer_ids, // Now an array of printer IDs
      supplier,
      part_number,
      price,
      link,
      notes
    } = req.body;
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    // Insert the part
    const result = await db.run(
      `INSERT INTO parts (
        name, description, quantity, minimum_quantity,
        supplier, part_number, price, link, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, quantity, minimum_quantity,
       supplier, part_number, price, link, notes]
    );
    
    const partId = result.lastID;
    
    // Insert printer associations if any
    if (Array.isArray(printer_ids) && printer_ids.length > 0) {
      for (const printerId of printer_ids) {
        await db.run(
          `INSERT INTO part_printers (part_id, printer_id)
           VALUES (?, ?)`,
          [partId, printerId]
        );
      }
    }
    
    // Commit the transaction
    await db.run('COMMIT');
    
    // Fetch the newly created part with its printers
    const newPart = await db.get(`
      SELECT * FROM parts
      WHERE id = ?
    `, partId);
    
    // Get associated printers
    const printers = await db.all(`
      SELECT pr.id, pr.name
      FROM printers pr
      JOIN part_printers pp ON pr.id = pp.printer_id
      WHERE pp.part_id = ?
      ORDER BY pr.name
    `, partId);
    
    // Transform to match frontend type
    const formattedPart = {
      ...newPart,
      printers: printers.length > 0 ? printers : []
    };
    
    res.status(201).json(formattedPart);
  } catch (error) {
    // Rollback on error
    await db.run('ROLLBACK');
    console.error('Error creating part:', error);
    res.status(500).json({ error: 'Failed to create part' });
  }
});

app.put('/api/parts/:id', validate([
  param('id').isInt().withMessage('Invalid part ID').toInt(),
  ...partValidationRules
]), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('PUT /api/parts/:id - Request body:', JSON.stringify(req.body, null, 2));
    
    const updates = { ...req.body };
    const printer_ids = updates.printer_ids; // Extract printer_ids
    
    // Remove properties that shouldn't be directly updated
    delete updates.id;
    delete updates.created_at;
    delete updates.printers; // Remove the printers array from updates
    delete updates.printer_ids; // Remove printer_ids as we'll handle them separately
    updates.updated_at = new Date().toISOString();
    
    // Define allowed fields to prevent SQL injection
    const allowedFields = [
      'name', 'description', 'quantity', 'minimum_quantity',
      'supplier', 'part_number', 'price', 'link', 'notes', 'updated_at'
    ];
    
    // Filter out any fields that aren't in the allowed list
    const validUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as Record<string, any>);
      
    if (Object.keys(validUpdates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    
    console.log('Updates after cleanup and validation:', JSON.stringify(validUpdates, null, 2));
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    // Build the SQL update statement for the part with validated fields
    const fields = Object.keys(validUpdates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => validUpdates[field]);
    
    console.log('SQL set clause:', setClause);
    console.log('SQL values:', JSON.stringify(values, null, 2));
    
    // Execute the update for the part
    await db.run(
      `UPDATE parts SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    
    // Update printer associations
    if (Array.isArray(printer_ids)) {
      // Remove existing associations
      await db.run(
        `DELETE FROM part_printers WHERE part_id = ?`,
        [id]
      );
      
      // Add new associations
      for (const printerId of printer_ids) {
        await db.run(
          `INSERT INTO part_printers (part_id, printer_id)
           VALUES (?, ?)`,
          [id, printerId]
        );
      }
    }
    
    // Commit the transaction
    await db.run('COMMIT');
    
    console.log('Update successful, fetching updated part');
    
    // Fetch the updated part
    const updatedPart = await db.get(`
      SELECT * FROM parts
      WHERE id = ?
    `, id);
    
    console.log('Updated part from DB:', JSON.stringify(updatedPart, null, 2));
    
    if (!updatedPart) {
      console.log('Part not found after update');
      return res.status(404).json({ error: 'Part not found' });
    }
    
    // Get associated printers
    const printers = await db.all(`
      SELECT pr.id, pr.name
      FROM printers pr
      JOIN part_printers pp ON pr.id = pp.printer_id
      WHERE pp.part_id = ?
      ORDER BY pr.name
    `, id);
    
    // Transform to match frontend type
    const formattedPart = {
      ...updatedPart,
      printers: printers.length > 0 ? printers : []
    };
    
    console.log('Formatted part for response:', JSON.stringify(formattedPart, null, 2));
    res.json(formattedPart);
  } catch (error: any) {
    // Rollback on error
    await db.run('ROLLBACK');
    console.error('Error updating part:', error);
    res.status(500).json({ error: 'Failed to update part', details: error.message });
  }
});

app.delete('/api/parts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Start a transaction
    await db.run('BEGIN TRANSACTION');
    
    // Delete associations first (the ON DELETE CASCADE should handle this, but being explicit)
    await db.run('DELETE FROM part_printers WHERE part_id = ?', id);
    
    // Delete the part
    await db.run('DELETE FROM parts WHERE id = ?', id);
    
    // Commit the transaction
    await db.run('COMMIT');
    
    res.status(204).send();
  } catch (error) {
    // Rollback on error
    await db.run('ROLLBACK');
    console.error('Error deleting part:', error);
    res.status(500).json({ error: 'Failed to delete part' });
  }
});

// Products API endpoints
app.get('/api/products', async (req, res) => {
  try {
    // Get all products
    const products = await db.all('SELECT * FROM products ORDER BY name');
    
    // For each product, get its associated filaments
    for (const product of products) {
      const filaments = await db.all(`
        SELECT f.*, pf.filament_usage_amount
        FROM filaments f
        JOIN product_filaments pf ON f.id = pf.filament_id
        WHERE pf.product_id = ?
        ORDER BY f.name
      `, product.id);
      
      product.filaments = filaments;
    }
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Get associated filaments
    const filaments = await db.all(`
      SELECT f.*, pf.filament_usage_amount
      FROM filaments f
      JOIN product_filaments pf ON f.id = pf.filament_id
      WHERE pf.product_id = ?
      ORDER BY f.name
    `, req.params.id);
    
    // Add filaments to the product object
    product.filaments = filaments;
    
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Validation rules for products
const productValidationRules = [
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required')
    .customSanitizer(value => sanitizeHtml(value)),
  body('business').optional({ nullable: true }).trim()
    .customSanitizer(value => sanitizeHtml(value)),
  body('filament_used').optional({ nullable: true }).isFloat({ min: 0 })
    .withMessage('Filament used must be a positive number').toFloat(),
  body('print_prep_time').optional({ nullable: true }).isFloat({ min: 0 })
    .withMessage('Print prep time must be a positive number').toFloat(),
  body('post_processing_time').optional({ nullable: true }).isFloat({ min: 0 })
    .withMessage('Post processing time must be a positive number').toFloat(), 
  body('additional_parts_cost').optional({ nullable: true }).isFloat({ min: 0 })
    .withMessage('Additional parts cost must be a positive number').toFloat(),
  body('list_price').optional({ nullable: true }).isFloat({ min: 0 })
    .withMessage('List price must be a positive number').toFloat(),
  body('notes').optional({ nullable: true }).trim()
    .customSanitizer(value => sanitizeHtml(value))
];

app.post('/api/products', validate(productValidationRules), async (req, res) => {
  try {
    const {
      name,
      business,
      filament_used,
      print_prep_time,
      post_processing_time,
      additional_parts_cost,
      list_price,
      notes
    } = req.body;

    const result = await db.run(
      `INSERT INTO products (
        name,
        business,
        filament_used,
        print_prep_time,
        post_processing_time,
        additional_parts_cost,
        list_price,
        notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        business,
        filament_used,
        print_prep_time,
        post_processing_time,
        additional_parts_cost,
        list_price,
        notes
      ]
    );

    const newProduct = await db.get('SELECT * FROM products WHERE id = ?', result.lastID);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', validate([
  param('id').isInt().withMessage('Invalid product ID').toInt(),
  ...productValidationRules
]), async (req, res) => {
  try {
    const {
      name,
      business,
      filament_used,
      print_prep_time,
      post_processing_time,
      additional_parts_cost,
      list_price,
      notes
    } = req.body;

    await db.run(
      `UPDATE products SET
        name = ?,
        business = ?,
        filament_used = ?,
        print_prep_time = ?,
        post_processing_time = ?,
        additional_parts_cost = ?,
        list_price = ?,
        notes = ?
      WHERE id = ?`,
      [
        name,
        business,
        filament_used,
        print_prep_time,
        post_processing_time,
        additional_parts_cost,
        list_price,
        notes,
        req.params.id
      ]
    );

    const updatedProduct = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
    if (!updatedProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await db.run('DELETE FROM products WHERE id = ?', req.params.id);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Product-Filament relationship endpoints
app.get('/api/products/:id/filaments', async (req, res) => {
  try {
    const filaments = await db.all(`
      SELECT f.*, pf.filament_usage_amount
      FROM filaments f
      JOIN product_filaments pf ON f.id = pf.filament_id
      WHERE pf.product_id = ?
      ORDER BY f.name
    `, req.params.id);
    
    res.json(filaments);
  } catch (error) {
    console.error('Error fetching product filaments:', error);
    res.status(500).json({ error: 'Failed to fetch product filaments' });
  }
});

// Validation rules for product-filament relationship
const productFilamentValidationRules = [
  body('filament_id').isInt().withMessage('Filament ID must be a valid number').toInt(),
  body('filament_usage_amount').optional({ nullable: true }).isFloat({ min: 0 })
    .withMessage('Filament usage amount must be a positive number').toFloat()
];

app.post('/api/products/:id/filaments', validate([
  param('id').isInt().withMessage('Invalid product ID').toInt(),
  ...productFilamentValidationRules
]), async (req, res) => {
  try {
    const { filament_id } = req.body;
    
    if (!filament_id) {
      return res.status(400).json({ error: 'Filament ID is required' });
    }
    
    // Check if product exists
    const product = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if filament exists
    const filament = await db.get('SELECT * FROM filaments WHERE id = ?', filament_id);
    if (!filament) {
      return res.status(404).json({ error: 'Filament not found' });
    }
    
    // Check if relationship already exists
    const existing = await db.get(
      'SELECT * FROM product_filaments WHERE product_id = ? AND filament_id = ?',
      req.params.id, filament_id
    );
    
    if (existing) {
      return res.status(409).json({ error: 'Filament already associated with this product' });
    }
    
    // Add the relationship
    await db.run(
      'INSERT INTO product_filaments (product_id, filament_id) VALUES (?, ?)',
      req.params.id, filament_id
    );
    
    res.status(201).json({ message: 'Filament added to product successfully' });
  } catch (error) {
    console.error('Error adding filament to product:', error);
    res.status(500).json({ error: 'Failed to add filament to product' });
  }
});

app.patch('/api/products/:productId/filaments/:filamentId', validate([
  param('productId').isInt().withMessage('Invalid product ID').toInt(),
  param('filamentId').isInt().withMessage('Invalid filament ID').toInt(),
  body('filament_usage_amount').isFloat({ min: 0 })
    .withMessage('Filament usage amount must be a positive number').toFloat()
]), async (req, res) => {
  try {
    const { productId, filamentId } = req.params;
    const { filament_usage_amount } = req.body;
    
    // Check if relationship exists
    const relationship = await db.get(
      'SELECT * FROM product_filaments WHERE product_id = ? AND filament_id = ?',
      productId, filamentId
    );
    
    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    
    // Update the usage amount
    await db.run(
      'UPDATE product_filaments SET filament_usage_amount = ? WHERE product_id = ? AND filament_id = ?',
      filament_usage_amount, productId, filamentId
    );
    
    res.json({ message: 'Filament usage amount updated successfully' });
  } catch (error) {
    console.error('Error updating filament usage amount:', error);
    res.status(500).json({ error: 'Failed to update filament usage amount' });
  }
});

app.delete('/api/products/:productId/filaments/:filamentId', async (req, res) => {
  try {
    const { productId, filamentId } = req.params;
    
    // Check if relationship exists
    const relationship = await db.get(
      'SELECT * FROM product_filaments WHERE product_id = ? AND filament_id = ?',
      productId, filamentId
    );
    
    if (!relationship) {
      return res.status(404).json({ error: 'Relationship not found' });
    }
    
    // Remove the relationship
    await db.run(
      'DELETE FROM product_filaments WHERE product_id = ? AND filament_id = ?',
      productId, filamentId
    );
    
    res.json({ message: 'Filament removed from product successfully' });
  } catch (error) {
    console.error('Error removing filament from product:', error);
    res.status(500).json({ error: 'Failed to remove filament from product' });
  }
});

// Settings endpoints
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.all('SELECT key, value FROM settings');
    const settingsObject = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    // Add cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(settingsObject);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Validation for settings
const validateSettings = validate([
  body().isObject().withMessage('Settings must be an object'),
  body('*.').custom((value) => {
    // Ensure all values are either numbers or can be converted to numbers
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error('All settings values must be numbers');
    }
    return true;
  })
]);

app.put('/api/settings', validateSettings, async (req, res) => {
  try {
    const settings = req.body;
    
    // Validate settings
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ error: 'Invalid settings data' });
    }
    
    // Update each setting
    for (const [key, value] of Object.entries(settings)) {
      // Ensure sanitized numeric value
      const sanitizedValue = validateNumber(value, 0).toString();
      
      await db.run(
        'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?',
        sanitizedValue, key
      );
    }
    
    // Return updated settings
    const updatedSettings = await db.all('SELECT key, value FROM settings');
    const settingsObject = updatedSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    // Add cache control headers
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.json(settingsObject);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default app;
