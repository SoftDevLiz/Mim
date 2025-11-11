import axios from "axios";
import type { NewItem } from "../App";

interface NewItemFormProps {
    barcode: string;
    setNewItem: (newItem: NewItem) => void;
    newItem: NewItem;
    setBarcode: (barcode: string) => void;
    fetchItems: () => void;
}

const NewItemForm = ({ barcode, setNewItem, newItem, setBarcode, fetchItems }: NewItemFormProps) => {
    return (
        <div className="p-4 mb-4 border rounded bg-gray-50">
        <p className="mb-2">New item detected: {barcode}</p>
        <input
            type="text"
            placeholder="Name (optional)"
            value={newItem.name || ""}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            className="border p-1 rounded mr-2"
        />
        <input
            type="text"
            placeholder="Part number (optional)"
            value={newItem.partNumber || ""}
            onChange={(e) => setNewItem({ ...newItem, partNumber: e.target.value })}
            className="border p-1 rounded mr-2"
        />
        <input
            type="text"
            placeholder="Location (optional)"
            value={newItem.loc || ""}
            onChange={(e) => setNewItem({ ...newItem, loc: e.target.value })}
            className="border p-1 rounded mr-2"
        />
        <button
            className="bg-green-500 text-white px-3 py-1 rounded mr-2"
            onClick={async () => {
                const payload = {
                    barcode: newItem.barcode,
                    ...(newItem.name && newItem.name.trim() !== "" ? { name: newItem.name.trim() } : {}),
                    ...(newItem.partNumber && newItem.partNumber.trim() !== "" ? { partNumber: newItem.partNumber.trim() } : {}),
                    ...(newItem.loc && newItem.loc.trim() !== "" ? { loc: newItem.loc.trim() } : {}),
                };
                await axios.post("http://localhost:4000/scan", payload);
                setNewItem({ barcode: "", name: "", partNumber: "", loc: "" });
                setBarcode("");
                fetchItems();
            }}
        >
            Save
        </button>
        </div>
    );
};

export default NewItemForm;
