import { useState, useEffect, useCallback } from "react";
import type { FormEvent } from "react";
import axios from "axios";
// import NewItemForm from "./components/NewItemForm";

export interface Item {
  id: number;
  barcode: string;
  partNumber?: string;
  name?: string;
  qty: number;
  loc?: string;
}

const AUTO_SUBMIT_DELAY_MS = 250;

function App() {
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState<Item[]>([]);

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
      await axios.post("http://localhost:4000/scan", { barcode: trimmedBarcode });
      setBarcode("");
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  }, [barcode, fetchItems]);

  useEffect(() => {
    const trimmedBarcode = barcode.trim();
    if (!trimmedBarcode) return;

    const timeout = setTimeout(() => {
      handleScan();
    }, AUTO_SUBMIT_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [barcode, handleScan]);

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(`http://localhost:4000/items/${id}`);
      await fetchItems();
    } catch (err) {
      console.error("Error deleting items:", err);
    }
  };

  const handleReset = async () => {
    const confirmReset = window.confirm("This will delete all items. Continue?");
    if (!confirmReset) return;

    try {
      await axios.delete("http://localhost:4000/items");
      setBarcode("");
      await fetchItems();
    } catch (err) {
      console.error("Error resetting items:", err);
    }
  };

  const handleFieldChange = (
    id: number,
    field: "partNumber" | "name" | "qty" | "loc",
    value: string
  ) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        if (field === "qty") {
          const nextQty = Number(value);
          if (Number.isNaN(nextQty) || nextQty < 0) return item;
          return { ...item, qty: nextQty };
        }

        return { ...item, [field]: value };
      })
    );
  };

  const handleFieldSave = async (
    id: number,
    field: "partNumber" | "name" | "qty" | "loc",
    value: string
  ) => {
    try {
      const payload: Partial<Item> = {};

      if (field === "qty") {
        const parsed = Number(value);
        if (Number.isNaN(parsed) || parsed < 0) return;
        payload.qty = parsed;
      } else {
        payload[field] = value;
      }

      await axios.put(`http://localhost:4000/items/${id}`, payload);
      await fetchItems();
    } catch (err) {
      console.error("Error updating item:", err);
    }
  };

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
        <button
          onClick={handleReset}
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          Reset All
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

      {/* {newItem && (
        <NewItemForm barcode={barcode} setNewItem={setNewItem} newItem={newItem} setBarcode={setBarcode} fetchItems={fetchItems} />
      )} */}

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
          {[...items].reverse().map((item) => (
            <tr key={item.id} className="text-center">
              <td className="border px-2 py-1">{item.barcode}</td>
              <td className="border px-2 py-1">
                <input
                  className="w-full text-center border rounded px-1 py-1"
                  value={item.partNumber ?? ""}
                  onChange={(e) => handleFieldChange(item.id, "partNumber", e.target.value)}
                  onBlur={(e) => handleFieldSave(item.id, "partNumber", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  className="w-full text-center border rounded px-1 py-1"
                  value={item.name ?? ""}
                  onChange={(e) => handleFieldChange(item.id, "name", e.target.value)}
                  onBlur={(e) => handleFieldSave(item.id, "name", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  min={0}
                  className="w-full text-center border rounded px-1 py-1"
                  value={item.qty}
                  onChange={(e) => handleFieldChange(item.id, "qty", e.target.value)}
                  onBlur={(e) => handleFieldSave(item.id, "qty", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  className="w-full text-center border rounded px-1 py-1"
                  value={item.loc ?? ""}
                  onChange={(e) => handleFieldChange(item.id, "loc", e.target.value)}
                  onBlur={(e) => handleFieldSave(item.id, "loc", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                />
              </td>
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
