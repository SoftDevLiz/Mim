import { useState, useEffect } from "react";
import axios from "axios";
import NewItemForm from "./components/newItemForm";

interface Item {
  id: number;
  barcode: string;
  partNumber?: string;
  name?: string;
  qty: number;
}

export interface NewItem {
  barcode: string;
  name?: string;
  partNumber?: string;
}

function App() {
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [newItem, setNewItem] = useState<NewItem | null>(null);

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
      // Try adding the scan (it’ll increment if exists)
      await axios.post("http://localhost:4000/scan", { barcode });
      setBarcode("");
      fetchItems();
    } catch (err: any) {
      if (err.response?.data.error?.includes("Missing name")) {
        setNewItem({ barcode });
      } else {
        console.error(err);
      }
    }

    setBarcode("");
    fetchItems();
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
            <th className="border px-2 py-1">ID</th>
            <th className="border px-2 py-1">Barcode</th>
            <th className="border px-2 py-1">Part #</th>
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Qty</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="text-center">
              <td className="border px-2 py-1">{item.id}</td>
              <td className="border px-2 py-1">{item.barcode}</td>
              <td className="border px-2 py-1">{item.partNumber || "-"}</td>
              <td className="border px-2 py-1">{item.name || "-"}</td>
              <td className="border px-2 py-1">{item.qty}</td>
              <td className="border px-2 py-1"><button
                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                onClick={async () => {
                  if (!confirm("Are you sure you want to delete this item?")) return;
                  await axios.delete(`http://localhost:4000/items/${item.id}`);
                  fetchItems();
                }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
