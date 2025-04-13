import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Filament } from '../types/filament';
import { fetchFilaments, addFilament, updateFilament, deleteFilament } from '../services/api';

interface FilamentsContextType {
  filaments: Filament[];
  isLoading: boolean;
  error: string | null;
  refreshFilaments: () => Promise<void>;
  addFilament: (filament: Filament) => Promise<Filament>;
  updateFilament: (filament: Filament) => Promise<Filament>;
  deleteFilament: (id: number) => Promise<void>;
  isUpdating: boolean; // New state to track ongoing changes
  pendingChanges: { [key: number]: 'update' | 'delete' } | null; // Track items being modified
}

// Create the context with default values
const FilamentsContext = createContext<FilamentsContextType>({
  filaments: [],
  isLoading: false,
  error: null,
  isUpdating: false,
  pendingChanges: null,
  refreshFilaments: async () => {},
  addFilament: async () => ({ id: 0 } as Filament),
  updateFilament: async () => ({ id: 0 } as Filament),
  deleteFilament: async () => {}
});

// Custom hook for consuming the context
export const useFilaments = () => useContext(FilamentsContext);

interface FilamentsProviderProps {
  children: ReactNode;
}

// Provider component for filaments data
export const FilamentsProvider: React.FC<FilamentsProviderProps> = ({ children }) => {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [pendingChanges, setPendingChanges] = useState<{ [key: number]: 'update' | 'delete' } | null>(null);

  // Function to refresh filaments from the API
  const refreshFilaments = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedFilaments = await fetchFilaments();
      setFilaments(loadedFilaments);
    } catch (err) {
      setError('Failed to load filaments');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load filaments on mount
  useEffect(() => {
    refreshFilaments();
  }, [refreshFilaments]);

  // Function to add a filament with optimistic update
  const handleAddFilament = async (filament: Filament): Promise<Filament> => {
    setIsUpdating(true);
    setError(null);
    
    // Generate temporary ID for optimistic update
    const tempId = Date.now() * -1; // Use negative IDs for temporary items
    const tempFilament: Filament = {
      ...filament,
      id: tempId,
      // Add required fields that might be generated server-side
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Optimistically add to UI
    setFilaments(prev => [...prev, tempFilament]);
    
    try {
      // Perform actual API call
      const newFilament = await addFilament(filament);
      
      // Replace temporary filament with real one from server
      setFilaments(prev => 
        prev.map(f => f.id === tempId ? newFilament : f)
      );
      
      return newFilament;
    } catch (err) {
      // On error, remove the temporary filament
      setFilaments(prev => prev.filter(f => f.id !== tempId));
      setError('Failed to add filament');
      console.error(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to update a filament with optimistic update
  const handleUpdateFilament = async (filament: Filament): Promise<Filament> => {
    if (!filament.id) {
      throw new Error('Filament ID is required for update');
    }
    
    setIsUpdating(true);
    setError(null);
    
    // Mark this filament as being updated
    setPendingChanges(prev => ({ ...prev, [filament.id as number]: 'update' }));
    
    // Optimistically update in UI
    const optimisticFilament = {
      ...filament,
      updated_at: new Date().toISOString()
    };
    
    setFilaments(prev => 
      prev.map(f => f.id === filament.id ? optimisticFilament : f)
    );
    
    try {
      // Perform actual API call
      const updatedFilament = await updateFilament(filament);
      
      // Update with the server's response
      setFilaments(prev => 
        prev.map(f => f.id === updatedFilament.id ? updatedFilament : f)
      );
      
      return updatedFilament;
    } catch (err) {
      // On error, refresh the data to revert changes
      refreshFilaments();
      setError('Failed to update filament');
      console.error(err);
      throw err;
    } finally {
      setIsUpdating(false);
      setPendingChanges(prev => {
        if (!prev) return null;
        const updated = { ...prev };
        delete updated[filament.id as number];
        return Object.keys(updated).length > 0 ? updated : null;
      });
    }
  };

  // Function to delete a filament with optimistic update
  const handleDeleteFilament = async (id: number): Promise<void> => {
    setIsUpdating(true);
    setError(null);
    
    // Mark this filament as being deleted
    setPendingChanges(prev => ({ ...prev, [id]: 'delete' }));
    
    // Store the filament for potential restoration
    const filamentToDelete = filaments.find(f => f.id === id);
    
    // Optimistically remove from UI
    setFilaments(prev => prev.filter(f => f.id !== id));
    
    try {
      // Perform actual API call
      await deleteFilament(id);
      // Nothing to do on success, already removed
    } catch (err) {
      // On error, restore the filament
      if (filamentToDelete) {
        setFilaments(prev => [...prev, filamentToDelete]);
      } else {
        // If we can't restore, refresh from server
        refreshFilaments();
      }
      setError('Failed to delete filament');
      console.error(err);
      throw err;
    } finally {
      setIsUpdating(false);
      setPendingChanges(prev => {
        if (!prev) return null;
        const updated = { ...prev };
        delete updated[id];
        return Object.keys(updated).length > 0 ? updated : null;
      });
    }
  };

  // Value provided to consumers of the context
  const value: FilamentsContextType = {
    filaments,
    isLoading,
    error,
    isUpdating,
    pendingChanges,
    refreshFilaments,
    addFilament: handleAddFilament,
    updateFilament: handleUpdateFilament,
    deleteFilament: handleDeleteFilament
  };

  return (
    <FilamentsContext.Provider value={value}>
      {children}
    </FilamentsContext.Provider>
  );
};

export default FilamentsContext;