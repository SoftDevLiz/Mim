import axios from "axios";

const ActionButtons = ({ id, onDeleted }) => {

const handleDelete = async (id) => {
    try {
        await axios.delete(`http://localhost:4000/items/${id}`);
        onDeleted?.();
    } catch (e) {
        console.error("Delete failed", e);
    }
};

// const handleEdit = async () => {
//     try {
//         await
//     } catch (e) {
//         console.error("Edit failed", e)
//     }
// }

    return(
        <div className="flex">
            <button
                className="bg-red-500 text-white px-3 py-1 rounded mr-2"
                onClick={() => handleDelete(id)}
            >
                Delete
            </button>
            <button 
                className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                onClick={() => handleEdit()}
            >
                Edit
            </button>
        </div>
    )
}

export default ActionButtons;