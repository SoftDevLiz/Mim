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
    const { barcode } = req.body;
    if (!barcode) return res.status(400).json({ error: "Missing barcode" });

    const item = db.prepare("SELECT * FROM items WHERE barcode = ?").get(barcode);

    if (item) {
        // Update existing
        db.prepare("UPDATE items SET qty = qty + 1 WHERE barcode = ?").run(barcode);
      } else {
        // Insert new
        db.prepare("INSERT INTO items (barcode, qty) VALUES (?, 1)").run(barcode);
      }

      const updated = db.prepare("SELECT * FROM items WHERE barcode = ?").get(barcode);
      res.json(updated);
    });

// Get all items
app.get("/items", (req, res) => {
    const items = db.prepare("SELECT * FROM items ORDER BY id").all();
    res.json(items);
  });

// Start the server
const PORT = 5173;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));