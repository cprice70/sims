import React, { useState } from 'react';
import { Filament } from '../types/filament';
import { useFilaments } from '../contexts/AppContext';

interface FilamentListProps {
  filaments: Filament[];
  onUpdate: (filament: Filament) => void;
  onDelete: (id: number) => void;
}

const FilamentList: React.FC<FilamentListProps> = () => {
  // Get filaments data and functions from context
  const { 
    filaments, 
    updateFilament, 
    deleteFilament, 
    pendingChanges, 
    isUpdating 
  } = useFilaments();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<Filament | null>(null);

  // Start editing a filament
  const handleEditClick = (filament: Filament) => {
    setEditingId(filament.id);
    setEditFormData({ ...filament });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData(null);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (!editFormData) return;
    
    const { name, value, type } = e.target;
    
    setEditFormData({
      ...editFormData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData) return;
    
    try {
      await updateFilament(editFormData);
      setEditingId(null);
      setEditFormData(null);
    } catch (err) {
      // Error is handled in the context
    }
  };

  // Handle delete
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this filament?')) return;
    
    try {
      await deleteFilament(id);
    } catch (err) {
      // Error is handled in the context
    }
  };

  // Helper to determine if a filament is being modified
  const isFilamentPending = (id: number) => {
    return pendingChanges && pendingChanges[id];
  };

  return (
    <div className="border-2 border-black">
      <div className="bg-black text-white p-2 text-xs font-medium uppercase tracking-wider">
        Filament Inventory ({filaments.length})
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border-b border-r border-black text-left">Name</th>
              <th className="p-2 border-b border-r border-black text-left">Type</th>
              <th className="p-2 border-b border-r border-black text-left">Color</th>
              <th className="p-2 border-b border-r border-black text-center">Quantity</th>
              <th className="p-2 border-b border-black text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filaments.map(filament => {
              const isPending = isFilamentPending(filament.id as number);
              const isDeleting = isPending && pendingChanges?.[filament.id as number] === 'delete';
              const isUpdating = isPending && pendingChanges?.[filament.id as number] === 'update';
              
              return (
                <tr 
                  key={filament.id} 
                  className={`
                    border-b border-black
                    ${isDeleting ? 'opacity-50 bg-red-100' : ''}
                    ${isUpdating ? 'bg-yellow-50' : ''}
                    ${filament.id < 0 ? 'bg-blue-50' : ''} 
                  `}
                >
                  {editingId === filament.id ? (
                    <td colSpan={5} className="p-2">
                      <form onSubmit={handleSubmit} className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-sm font-medium">Name</label>
                            <input
                              type="text"
                              name="name"
                              value={editFormData?.name || ''}
                              onChange={handleInputChange}
                              className="w-full p-1 border border-gray-300"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">Material</label>
                            <select
                              name="material"
                              value={editFormData?.material || ''}
                              onChange={handleInputChange}
                              className="w-full p-1 border border-gray-300"
                              required
                            >
                              <option value="">Select Material</option>
                              <option value="PLA">PLA</option>
                              <option value="PETG">PETG</option>
                              <option value="ABS">ABS</option>
                              <option value="TPU">TPU</option>
                              <option value="Nylon">Nylon</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium">Color</label>
                            <input
                              type="text"
                              name="color"
                              value={editFormData?.color || ''}
                              onChange={handleInputChange}
                              className="w-full p-1 border border-gray-300"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">Quantity</label>
                            <input
                              type="number"
                              name="quantity"
                              value={editFormData?.quantity || 0}
                              onChange={handleInputChange}
                              className="w-full p-1 border border-gray-300"
                              min="0"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">Manufacturer</label>
                            <input
                              type="text"
                              name="manufacturer"
                              value={editFormData?.manufacturer || ''}
                              onChange={handleInputChange}
                              className="w-full p-1 border border-gray-300"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium">Cost ($)</label>
                            <input
                              type="number"
                              name="cost"
                              value={editFormData?.cost || 0}
                              onChange={handleInputChange}
                              className="w-full p-1 border border-gray-300"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium">Notes</label>
                          <textarea
                            name="notes"
                            value={editFormData?.notes || ''}
                            onChange={handleInputChange}
                            className="w-full p-1 border border-gray-300"
                            rows={2}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="px-3 py-1 bg-gray-300 text-gray-800 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-blue-600 text-white text-xs"
                            disabled={isUpdating}
                          >
                            {isUpdating ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="p-2 border-r border-black">
                        {filament.name}
                        {filament.id < 0 && <span className="ml-2 text-blue-600 text-xs">(Adding...)</span>}
                        {isUpdating && <span className="ml-2 text-yellow-600 text-xs">(Updating...)</span>}
                        {isDeleting && <span className="ml-2 text-red-600 text-xs">(Deleting...)</span>}
                      </td>
                      <td className="p-2 border-r border-black">{filament.material}</td>
                      <td className="p-2 border-r border-black">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-400" 
                            style={{ backgroundColor: filament.color }}
                          />
                          <span>{filament.color}</span>
                        </div>
                      </td>
                      <td className="p-2 border-r border-black text-center">{filament.quantity}</td>
                      <td className="p-2 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEditClick(filament)}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded"
                            disabled={isPending}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(filament.id as number)}
                            className="px-2 py-1 bg-red-600 text-white text-xs rounded"
                            disabled={isPending}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FilamentList;