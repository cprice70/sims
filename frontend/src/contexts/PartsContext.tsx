import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Part } from '../types/part';
import { API_URL } from '../config';

interface PartsContextType {
  parts: Part[];
  isLoading: boolean;
  error: string | null;
  refreshParts: () => Promise<void>;
  addPart: (part: Part) => Promise<Part>;
  updatePart: (part: Part) => Promise<Part>;
  deletePart: (id: number) => Promise<void>;
}

// Create the context with default values
const PartsContext = createContext<PartsContextType>({
  parts: [],
  isLoading: false,
  error: null,
  refreshParts: async () => {},
  addPart: async () => ({ id: 0 } as Part),
  updatePart: async () => ({ id: 0 } as Part),
  deletePart: async () => {}
});

// Custom hook for consuming the context
export const useParts = () => useContext(PartsContext);

interface PartsProviderProps {
  children: ReactNode;
}

// Provider component for parts data
export const PartsProvider: React.FC<PartsProviderProps> = ({ children }) => {
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch parts from the API
  const fetchParts = async (): Promise<Part[]> => {
    const response = await fetch(`${API_URL}/api/parts`);
    if (!response.ok) throw new Error('Failed to fetch parts');
    return response.json();
  };

  // Function to refresh parts data
  const refreshParts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedParts = await fetchParts();
      setParts(loadedParts);
    } catch (err) {
      setError('Failed to load parts');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load parts on mount
  useEffect(() => {
    refreshParts();
  }, [refreshParts]);

  // Function to add a part
  const handleAddPart = async (part: Part): Promise<Part> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/parts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(part)
      });
      
      if (!response.ok) throw new Error('Failed to add part');
      
      const newPart = await response.json();
      setParts(prev => [...prev, newPart]);
      return newPart;
    } catch (err) {
      setError('Failed to add part');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update a part
  const handleUpdatePart = async (part: Part): Promise<Part> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/parts/${part.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(part)
      });
      
      if (!response.ok) throw new Error('Failed to update part');
      
      const updatedPart = await response.json();
      setParts(prev => prev.map(p => p.id === updatedPart.id ? updatedPart : p));
      return updatedPart;
    } catch (err) {
      setError('Failed to update part');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a part
  const handleDeletePart = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/parts/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete part');
      
      setParts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError('Failed to delete part');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Value provided to consumers of the context
  const value: PartsContextType = {
    parts,
    isLoading,
    error,
    refreshParts,
    addPart: handleAddPart,
    updatePart: handleUpdatePart,
    deletePart: handleDeletePart
  };

  return (
    <PartsContext.Provider value={value}>
      {children}
    </PartsContext.Provider>
  );
};

export default PartsContext;