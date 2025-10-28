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
      name TEXT,
      qty INTEGER DEFAULT 0
    )
  `).run();

  // --- ROUTES ---

// Scan a product (barcode input)
app.post("/scan", (req, res) => {
  const { barcode, name, partNumber } = req.body;
  if (!barcode) return res.status(400).json({ error: "Missing barcode" });

    const item = db.prepare("SELECT * FROM items WHERE barcode = ?").get(barcode);

    if (item) {
        // Update existing
        db.prepare("UPDATE items SET qty = qty + 1 WHERE barcode = ?").run(barcode);
      } else {
        // New item -> require name and part number
        if (!name || !partNumber)
          return res
            .status(400)
            .json({ error: "Missing name or part number for new item" });

        db.prepare("INSERT INTO items (barcode, name, partNumber, qty) VALUES (?, ?, ?, 1)").run(barcode, name, partNumber);
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

// Start the server
const PORT = 4000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));