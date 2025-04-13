import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Printer } from '../types/printer';
import { API_URL } from '../config';

interface PrintersContextType {
  printers: Printer[];
  isLoading: boolean;
  error: string | null;
  refreshPrinters: () => Promise<void>;
  addPrinter: (printer: Printer) => Promise<Printer>;
  updatePrinter: (printer: Printer) => Promise<Printer>;
  deletePrinter: (id: number) => Promise<void>;
}

// Create the context with default values
const PrintersContext = createContext<PrintersContextType>({
  printers: [],
  isLoading: false,
  error: null,
  refreshPrinters: async () => {},
  addPrinter: async () => ({ id: 0, name: '' } as Printer),
  updatePrinter: async () => ({ id: 0, name: '' } as Printer),
  deletePrinter: async () => {}
});

// Custom hook for consuming the context
export const usePrinters = () => useContext(PrintersContext);

interface PrintersProviderProps {
  children: ReactNode;
}

// Provider component for printers data
export const PrintersProvider: React.FC<PrintersProviderProps> = ({ children }) => {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch printers from the API
  const fetchPrinters = async (): Promise<Printer[]> => {
    const response = await fetch(`${API_URL}/api/printers`);
    if (!response.ok) throw new Error('Failed to fetch printers');
    return response.json();
  };

  // Function to refresh printers data
  const refreshPrinters = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedPrinters = await fetchPrinters();
      setPrinters(loadedPrinters);
    } catch (err) {
      setError('Failed to load printers');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load printers on mount
  useEffect(() => {
    refreshPrinters();
  }, [refreshPrinters]);

  // Function to add a printer
  const handleAddPrinter = async (printer: Printer): Promise<Printer> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/printers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(printer)
      });
      
      if (!response.ok) throw new Error('Failed to add printer');
      
      const newPrinter = await response.json();
      setPrinters(prev => [...prev, newPrinter]);
      return newPrinter;
    } catch (err) {
      setError('Failed to add printer');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to update a printer
  const handleUpdatePrinter = async (printer: Printer): Promise<Printer> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/printers/${printer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(printer)
      });
      
      if (!response.ok) throw new Error('Failed to update printer');
      
      const updatedPrinter = await response.json();
      setPrinters(prev => prev.map(p => p.id === updatedPrinter.id ? updatedPrinter : p));
      return updatedPrinter;
    } catch (err) {
      setError('Failed to update printer');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Function to delete a printer
  const handleDeletePrinter = async (id: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/api/printers/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete printer');
      
      setPrinters(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError('Failed to delete printer');
      console.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Value provided to consumers of the context
  const value: PrintersContextType = {
    printers,
    isLoading,
    error,
    refreshPrinters,
    addPrinter: handleAddPrinter,
    updatePrinter: handleUpdatePrinter,
    deletePrinter: handleDeletePrinter
  };

  return (
    <PrintersContext.Provider value={value}>
      {children}
    </PrintersContext.Provider>
  );
};

export default PrintersContext;