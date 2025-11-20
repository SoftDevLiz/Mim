import { useState, useEffect, useCallback } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import NewItemForm from "./components/NewItemForm";

export interface Item {
  id: number;
  barcode: string;
  partNumber?: string;
  name?: string;
  qty: number;
  loc?: string;
}

export interface NewItem {
  barcode: string;
  name?: string;
  partNumber?: string;
  loc?: string;
}

const AUTO_SUBMIT_DELAY_MS = 750;

function App() {
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState<NewItem | null>(null);

  const fetchItems = useCallback(async () => {
    const res = await axios.get<Item[]>("http://localhost:4000/items");
    setItems(res.data);
  }, []);

  // Load items on start
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleScan = useCallback(async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) return;

    try {
      // Check if item exists first
      const itemExists = items.find((item) => item.barcode === trimmedBarcode);
      if (itemExists) {
        // Item exists, just increment
        await axios.post("http://localhost:4000/scan", { barcode: trimmedBarcode });
        setBarcode("");
        fetchItems();
      } else {
        // New item - show form
        setNewItem({ barcode: trimmedBarcode, name: "", partNumber: "" });
      }
    } catch (err) {
      console.error(err);
    }
  }, [barcode, items, fetchItems]);

  useEffect(() => {
    if (newItem) return;
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) return;

    const timeout = setTimeout(() => {
      handleScan();
    }, AUTO_SUBMIT_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [barcode, newItem, handleScan]);

  useEffect(() => {
    if (barcode.trim()) return;
    setNewItem(null);
  }, [barcode]);

  const handleDelete = async (id: number) => {
    try {
      axios.delete(`http://localhost:4000/items/${id}`)
      fetchItems();
    } catch (err) {
      console.error("Error deleting items:", err)
    }
  }

  const handleExport = () => {
    if (!items.length) return;

    const headers = ["Barcode", "Part #", "Name", "Qty", "Loc"];
    const rows = items.map(({ barcode: itemBarcode, partNumber, name, qty, loc }) => ([
      itemBarcode,
      partNumber ?? "",
      name ?? "",
      qty.toString(),
      loc ?? "",
    ]));

    const escapeCell = (value: string) => {
      const needsQuotes = /[",\n]/.test(value);
      const escapedValue = value.replace(/"/g, '""');
      return needsQuotes ? `"${escapedValue}"` : escapedValue;
    };

    const csvContent = [headers, ...rows]
      .map((row) => row.map(escapeCell).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `stock-take-${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Stock Take</h1>
        <button
          onClick={handleExport}
          className="bg-emerald-500 text-white px-4 py-2 rounded hover:bg-emerald-600 disabled:bg-gray-300 disabled:text-gray-500"
          disabled={!items.length}
        >
          Export CSV
        </button>
      </div>

      {/* Scan Input */}
      <form className="flex gap-2 mb-6" onSubmit={handleScan}>
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          placeholder="Scan or type barcode"
          className="border p-2 flex-1 rounded"
          autoFocus
        />
        <button type="submit" className="hidden" aria-hidden="true">
          Submit
        </button>
      </form>

      {newItem && (
        <NewItemForm barcode={barcode} setNewItem={setNewItem} newItem={newItem} setBarcode={setBarcode} fetchItems={fetchItems} />
      )}

      {/* Stock Table */}
      <table className="w-full table-auto border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border px-2 py-1">Barcode</th>
            <th className="border px-2 py-1">Part #</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Qty</th>
            <th className="border px-2 py-1">Loc</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="text-center">
              <td className="border px-2 py-1">{item.barcode}</td>
              <td className="border px-2 py-1">{item.partNumber}</td>
              <td className="border px-2 py-1">{item.name}</td>
              <td className="border px-2 py-1">{item.qty}</td>
              <td className="border px-2 py-1">{item.loc || "-"}</td>
              <td className="border px-2 py-1">
                <button
                  className="bg-red-500 text-white px-4 rounded hover:bg-red-600"
                  onClick={() => handleDelete(item.id)}
                  >Delete entire row</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
