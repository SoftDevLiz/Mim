import express from "express";
import cors from "cors";
import Database from "better-sqlite3";

// Create the Express app
const app = express();
app.use(cors());
app.use(express.json());

// Connect to SQLite (creates stock.db if it doesn't exist)
const db = new Database("stock.db");

// Create a table if it doesn’t exist yet
db.prepare(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      barcode TEXT UNIQUE,
      partNumber TEXT UNIQUE,
      name TEXT,
      qty INTEGER DEFAULT 0 CHECK (qty >= 0),
      loc TEXT
    )
  `).run();

  // --- ROUTES ---

// Scan a product (barcode input)
app.post("/scan", (req, res) => {
  const { barcode, name, partNumber, loc } = req.body;
  if (!barcode) return res.status(400).json({ error: "Missing barcode" });

    const item = db.prepare("SELECT * FROM items WHERE barcode = ?").get(barcode);

    if (item) {
        // Update existing
        db.prepare("UPDATE items SET qty = qty + 1 WHERE barcode = ?").run(barcode);
      } else {
        db.prepare("INSERT INTO items (barcode, name, partNumber, loc, qty) VALUES (?, ?, ?, ?, 1)").run(barcode, name, partNumber, loc);
      }

      const updated = db.prepare("SELECT * FROM items WHERE barcode = ?").get(barcode);
      res.json(updated);
    });

// Get all items
app.get("/items", (req, res) => {
    const items = db.prepare("SELECT * FROM items ORDER BY id").all();
    res.json(items);
  });

// Delete an item
app.delete("/items/:id", (req, res) => {
  const { id } = req.params;
  db.prepare("DELETE FROM items WHERE id = ?").run(id);
  res.json({success: true})
})

// Edit an item
app.put("/items/:id", (req, res) => {
  const { id } = req.params;
  // Check if item with ID exists
  const item = db.prepare("SELECT * FROM items WHERE id = ?").get(id);
  if (!item) {
    return res.status(404).json({ error: "Item with that ID does not exist in DB"})
  }

  // Read the body
  const updates = req.body;

  /** The only fields that are allowed to be updated */
  const allowed = ["partNumber", "name", "qty", "loc"]

  // Check the keys in the json object against the allowed keys
  for (const key of Object.keys(updates)) {
    if (!allowed.includes(key)) {
      return res.status(400).json({ error: `You are trying to edit an invalid field: ${key}`})
    }
  }
  /** Stores validated keys */
  const validUpdates = {};

  // Validates key values (QTY must be 0 and up, and partnumber/name/loc must be text or empty string)
  for (const key of Object.keys(updates)) {
    const value = updates[key];
    const isQtyKey = key === 'qty';

    if (isQtyKey) {
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        return res.status(400).json({ error: 'QTY must be a non-negative integer' });
      }
      validUpdates.qty = value;
    } else {
      if (typeof value === 'string' && value.trim() === '') {
        validUpdates[key] = '-';
      } else {
        validUpdates[key] = value;
      }
    }
  }

  // Checks if validUpdates contains anything
  if (Object.key(validUpdates).length === 0) {
    return res.status(400).json({ error: "No valid fields to update" });
  }

  // Dynamically assemble the SQL statement so that correct fields and positioning is targeted
  const keys = Object.keys(validUpdates);
  const setClause = keys.map(key => `${key} = ?`).join(", ");
  const values = keys.map(key => validUpdates[key]);
  values.push(id);
  const sql = `UPDATE items SET ${setClause} WHERE id = ?`

  // Execute the update, with some error handling
  try {
    db.prepare(sql).run(...values);

    const updatedItem = db.prepare("SELECT * FROM items WHERE id = ?").get(id)
    res.json(updatedItem);
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(409).json({ error: "Duplicate value for a unique field" });
    } else {
      res.status(400).json({ error: err.message })
    }
  }
})

// Start the server
const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));