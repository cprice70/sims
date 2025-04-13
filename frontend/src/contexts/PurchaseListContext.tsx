import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PurchaseListItem } from '../types/purchase';
import { API_URL } from '../config';

interface PurchaseListContextType {
  items: PurchaseListItem[];
  isLoading: boolean;
  error: string | null;
  refreshItems: () => Promise<void>;
  addItem: (item: PurchaseListItem) => Promise<PurchaseListItem>;
  updateItem: (item: PurchaseListItem) => Promise<PurchaseListItem>;
  deleteItem: (id: number) => Promise<void>;
}

// Create the context with default values
const PurchaseListContext = createContext<PurchaseListContextType>({
  items: [],
  isLoading: false,
  error: null,
  refreshItems: async () => {},
  addItem: async () => ({ id: 0 } as PurchaseListItem),
  updateItem: async () => ({ id: 0 } as PurchaseListItem),
  deleteItem: async () => {}
});

// Custom hook for consuming the context
export const usePurchaseList = () => useContext(PurchaseListContext);

interface PurchaseListProviderProps {
  children: ReactNode;
}

// Provider component for purchase list data
export const PurchaseListProvider: React.FC<PurchaseListProviderProps> = ({ children }) => {
  const [items, setItems] = useState<PurchaseListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch purchase list from the API
  const fetchPurchaseList = async (): Promise<PurchaseListItem[]> => {
    const response = await fetch(`${API_URL}/api/purchase-list`);
    if (!response.ok) throw new Error('Failed to fetch purchase list');
    return response.json();
  };

  // Function to refresh purchase list data
  const refreshItems = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedItems = await fetchPurchaseList();
      setItems(loadedItems);
    } catch (err) {
      setError('Failed to load purchase list');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load purchase list on mount
  useEffect(() => {
    refreshItems();
  }, [refreshItems]);

  // Function to add a purchase item
  const handleAddItem = async (item: PurchaseListItem): Promise<PurchaseListItem> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/purchase-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });
      
      if (!response.ok) throw new Error('Failed to add purchase item');
      
      const newItem = await response.json();
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      setError('Failed to add purchase item');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update a purchase item
  const handleUpdateItem = async (item: PurchaseListItem): Promise<PurchaseListItem> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/purchase-list/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
      });
      
      if (!response.ok) throw new Error('Failed to update purchase item');
      
      const updatedItem = await response.json();
      setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
      return updatedItem;
    } catch (err) {
      setError('Failed to update purchase item');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a purchase item
  const handleDeleteItem = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/purchase-list/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete purchase item');
      
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      setError('Failed to delete purchase item');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Value provided to consumers of the context
  const value: PurchaseListContextType = {
    items,
    isLoading,
    error,
    refreshItems,
    addItem: handleAddItem,
    updateItem: handleUpdateItem,
    deleteItem: handleDeleteItem
  };

  return (
    <PurchaseListContext.Provider value={value}>
      {children}
    </PurchaseListContext.Provider>
  );
};

export default PurchaseListContext;