import { useState, useEffect, useRef } from 'react';
import { Filament } from '../types/filament';
import { API_URL } from '../config';

interface FilamentSelectorProps {
  productId: number | undefined;
  selectedFilaments: Filament[];
  onFilamentsChange: (filaments: Filament[]) => void;
}

const FilamentSelector = ({ productId, selectedFilaments, onFilamentsChange }: FilamentSelectorProps) => {
  const [allFilaments, setAllFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFilamentDropdownOpen, setIsFilamentDropdownOpen] = useState(false);
  const [filamentSearch, setFilamentSearch] = useState('');
  const filamentDropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const usageAmountTimeoutRef = useRef<{ [key: number]: NodeJS.Timeout }>({});

  // Fetch all filaments
  useEffect(() => {
    const fetchFilaments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/filaments`);
        if (!response.ok) {
          throw new Error('Failed to fetch filaments');
        }
        const data = await response.json();
        setAllFilaments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFilaments();
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isFilamentDropdownOpen && searchInputRef.current) {
      // Small timeout to ensure the input is rendered before focusing
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 10);
    }
  }, [isFilamentDropdownOpen]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filamentDropdownRef.current && !filamentDropdownRef.current.contains(event.target as Node)) {
        setIsFilamentDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Add a filament to the product
  const handleAddFilament = async (filamentId: number) => {
    try {
      setLoading(true);
      
      // If we have a productId, update the association in the database
      if (productId) {
        const response = await fetch(`${API_URL}/api/products/${productId}/filaments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filament_id: filamentId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add filament');
        }
      }

      // Find the filament in allFilaments and add it to selectedFilaments
      const filamentToAdd = allFilaments.find(f => f.id === filamentId);
      if (filamentToAdd) {
        const updatedFilaments = [...selectedFilaments, filamentToAdd];
        onFilamentsChange(updatedFilaments);
      }

      // Reset search and close dropdown
      setFilamentSearch('');
      setIsFilamentDropdownOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Remove a filament from the product
  const handleRemoveFilament = async (filamentId: number) => {
    try {
      setLoading(true);
      
      // If we have a productId, update the association in the database
      if (productId) {
        const response = await fetch(`${API_URL}/api/products/${productId}/filaments/${filamentId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to remove filament');
        }
      }

      // Remove the filament from selectedFilaments
      const updatedFilaments = selectedFilaments.filter(f => f.id !== filamentId);
      onFilamentsChange(updatedFilaments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Update filament usage amount with debouncing
  const handleUsageAmountChange = async (filamentId: number, amount: number) => {
    // Clear any existing timeout for this filament
    if (usageAmountTimeoutRef.current[filamentId]) {
      clearTimeout(usageAmountTimeoutRef.current[filamentId]);
    }

    // Update the filament in selectedFilaments immediately for UI responsiveness
    const updatedFilaments = selectedFilaments.map(f => {
      if (f.id === filamentId) {
        return { ...f, filament_usage_amount: amount };
      }
      return f;
    });
    onFilamentsChange(updatedFilaments);

    // Set a new timeout to make the API call after 500ms of no changes
    usageAmountTimeoutRef.current[filamentId] = setTimeout(async () => {
      try {
        setLoading(true);
        
        // If we have a productId, update the usage amount in the database
        if (productId) {
          const response = await fetch(`${API_URL}/api/products/${productId}/filaments/${filamentId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ filament_usage_amount: amount }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to update filament usage amount');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(usageAmountTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);

  // Get available filaments (those not already selected)
  const availableFilaments = allFilaments.filter(
    filament => !selectedFilaments.some(selected => selected.id === filament.id)
  );

  // Filter filaments based on search
  const filteredFilaments = availableFilaments.filter(filament =>
    filament.name.toLowerCase().includes(filamentSearch.toLowerCase()) ||
    filament.material.toLowerCase().includes(filamentSearch.toLowerCase()) ||
    filament.color.toLowerCase().includes(filamentSearch.toLowerCase()) ||
    filament.manufacturer?.toLowerCase().includes(filamentSearch.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium uppercase tracking-wider">Associated Filaments</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 text-sm">
          {error}
        </div>
      )}
      
      {/* Display selected filaments */}
      <div className="space-y-2">
        {selectedFilaments.length === 0 ? (
          <p className="text-sm text-gray-500">No filaments associated with this product.</p>
        ) : (
          <div>
            <ul className="border border-black divide-y divide-gray-200">
              {selectedFilaments.map(filament => (
                <li key={filament.id} className="flex justify-between items-center p-2 text-sm">
                  <div className="flex items-center">
                    <div 
                      className="h-4 w-4 border border-black mr-2"
                      style={{ backgroundColor: filament.color }}
                    />
                    <div>
                      <span className="font-medium">{filament.name}</span>
                      <span className="text-gray-500 ml-2">
                        {filament.material} - {filament.color}
                        {filament.manufacturer ? ` - ${filament.manufacturer}` : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-xs text-gray-500">Usage (g):</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={filament.filament_usage_amount || 0}
                        onChange={(e) => filament.id && handleUsageAmountChange(filament.id, parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-black text-sm"
                        disabled={loading}
                      />
                    </div>
                    {productId && (
                      <button
                        type="button"
                        onClick={() => filament.id && handleRemoveFilament(filament.id)}
                        className="text-red-600 hover:text-red-800 text-lg font-bold"
                        disabled={loading}
                        title="Remove filament"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Add filament form with stylized dropdown */}
      <div className="relative" ref={filamentDropdownRef} style={{ position: 'static' }}>
        <div 
          className="w-full px-3 py-2 border-2 border-black text-sm flex items-center cursor-pointer"
          onClick={() => setIsFilamentDropdownOpen(!isFilamentDropdownOpen)}
        >
          <span className="text-gray-500">Add filament to product</span>
        </div>
        {isFilamentDropdownOpen && (
          <div className="fixed z-50 w-full mt-1 bg-white border-2 border-black shadow-lg max-h-64 overflow-y-auto" 
               style={{ 
                 width: filamentDropdownRef.current ? filamentDropdownRef.current.offsetWidth : 'auto',
                 left: filamentDropdownRef.current ? filamentDropdownRef.current.getBoundingClientRect().left : 0,
                 top: filamentDropdownRef.current ? filamentDropdownRef.current.getBoundingClientRect().bottom + window.scrollY : 0
               }}>
            <input
              ref={searchInputRef}
              type="text"
              value={filamentSearch}
              onChange={(e) => setFilamentSearch(e.target.value)}
              placeholder="Search filaments..."
              className="w-full px-3 py-2 border-b-2 border-black text-sm"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="divide-y divide-gray-200">
              {filteredFilaments.length > 0 ? (
                filteredFilaments.map((filament) => (
                  <div
                    key={filament.id}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={() => filament.id && handleAddFilament(filament.id)}
                  >
                    <div 
                      className="h-4 w-4 border border-black mr-2"
                      style={{ backgroundColor: filament.color }}
                    />
                    <div>
                      <div>{filament.name}</div>
                      <div className="text-gray-500 text-xs">
                        {filament.material} - {filament.manufacturer || 'No manufacturer'}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500 text-sm">No matching filaments found</div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {!productId && selectedFilaments.length > 0 && (
        <p className="text-xs text-gray-500 mt-2">
          Note: Filaments will be associated with the product after saving.
        </p>
      )}
    </div>
  );
};

export default FilamentSelector; 