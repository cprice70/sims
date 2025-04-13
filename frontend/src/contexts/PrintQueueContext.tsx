import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PrintQueueItem } from '../types/printer';
import { API_URL } from '../config';

interface PrintQueueContextType {
  items: PrintQueueItem[];
  isLoading: boolean;
  error: string | null;
  refreshQueue: () => Promise<void>;
  addQueueItem: (item: PrintQueueItem) => Promise<PrintQueueItem>;
  updateQueueItem: (item: PrintQueueItem) => Promise<PrintQueueItem>;
  deleteQueueItem: (id: number) => Promise<void>;
  reorderQueueItems: (items: PrintQueueItem[]) => Promise<PrintQueueItem[]>;
}

// Create the context with default values
const PrintQueueContext = createContext<PrintQueueContextType>({
  items: [],
  isLoading: false,
  error: null,
  refreshQueue: async () => {},
  addQueueItem: async () => ({ id: 0 } as PrintQueueItem),
  updateQueueItem: async () => ({ id: 0 } as PrintQueueItem),
  deleteQueueItem: async () => {},
  reorderQueueItems: async () => []
});

// Custom hook for consuming the context
export const usePrintQueue = () => useContext(PrintQueueContext);

interface PrintQueueProviderProps {
  children: ReactNode;
}

// Provider component for print queue data
export const PrintQueueProvider: React.FC<PrintQueueProviderProps> = ({ children }) => {
  const [items, setItems] = useState<PrintQueueItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch print queue from the API
  const fetchPrintQueue = async (): Promise<PrintQueueItem[]> => {
    const response = await fetch(`${API_URL}/api/print-queue`);
    if (!response.ok) throw new Error('Failed to fetch print queue');
    return response.json();
  };

  // Function to refresh queue data
  const refreshQueue = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedItems = await fetchPrintQueue();
      setItems(loadedItems);
    } catch (err) {
      setError('Failed to load print queue');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load queue on mount
  useEffect(() => {
    refreshQueue();
  }, [refreshQueue]);

  // Function to add a queue item
  const handleAddQueueItem = async (item: PrintQueueItem): Promise<PrintQueueItem> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/print-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });
      
      if (!response.ok) throw new Error('Failed to add queue item');
      
      const newItem = await response.json();
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      setError('Failed to add queue item');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update a queue item
  const handleUpdateQueueItem = async (item: PrintQueueItem): Promise<PrintQueueItem> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/print-queue/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });
      
      if (!response.ok) throw new Error('Failed to update queue item');
      
      const updatedItem = await response.json();
      setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      return updatedItem;
    } catch (err) {
      setError('Failed to update queue item');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a queue item
  const handleDeleteQueueItem = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/print-queue/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete queue item');
      
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      setError('Failed to delete queue item');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reorder queue items
  const handleReorderQueueItems = async (itemsToReorder: PrintQueueItem[]): Promise<PrintQueueItem[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/print-queue/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: itemsToReorder })
      });
      
      if (!response.ok) throw new Error('Failed to reorder queue items');
      
      const reorderedItems = await response.json();
      setItems(reorderedItems);
      return reorderedItems;
    } catch (err) {
      setError('Failed to reorder queue items');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Value provided to consumers of the context
  const value: PrintQueueContextType = {
    items,
    isLoading,
    error,
    refreshQueue,
    addQueueItem: handleAddQueueItem,
    updateQueueItem: handleUpdateQueueItem,
    deleteQueueItem: handleDeleteQueueItem,
    reorderQueueItems: handleReorderQueueItems
  };

  return (
    <PrintQueueContext.Provider value={value}>
      {children}
    </PrintQueueContext.Provider>
  );
};

export default PrintQueueContext;