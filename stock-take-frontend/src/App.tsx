import { useState, useEffect } from "react";
import axios from "axios";
import NewItemForm from "./components/NewItemForm";
import ActionButtons from "./components/ActionButtons";

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

function App() {
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState<NewItem | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Load items on start
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const res = await axios.get<Item[]>("http://localhost:4000/items");
    setItems(res.data);
  };

  const handleScan = async () => {
    if (!barcode) return;

    try {
      // Check if item exists first
      const itemExists = items.find(item => item.barcode === barcode);
      if (itemExists) {
        // Item exists, just increment
        await axios.post("http://localhost:4000/scan", { barcode });
        setBarcode("");
        fetchItems();
      } else {
        // New item - show form
        setNewItem({ barcode, name: "", partNumber: "" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Stock Take</h1>

      {/* Scan Input */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScan()}
          placeholder="Scan or type barcode"
          className="border p-2 flex-1 rounded"
        />
        <button
          onClick={handleScan}
          className="bg-blue-500 text-white px-4 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>

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
              {/* Conditional rendering to edit partnumber */}
              <td className="border px-2 py-1">{editingId === item.id ? (
                <input type="text" defaultValue={item.partNumber || ""} id={`part-${item.id}`}
                  className="border p-1 w-full" /> ) : (
                    item.partNumber || "-"
                  )}
              </td>
              {/* Conditional rendering to edit name */}
              <td className="border px-2 py-1">{editingId === item.id ? (
                <input type="text" defaultValue={item.name || ""} id={`part-${item.id}`}
                  className="border p-1 w-full" /> ) : (
                    item.name || "-"
                  )}
              </td>
              <td className="border px-2 py-1">{item.qty}</td>
              <td className="border px-2 py-1">{item.loc || "-"}</td>
              <td className="border px-2 py-1"><ActionButtons id={item.id} onDeleted={fetchItems} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
