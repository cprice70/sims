import React from 'react';
import PrinterList from '../components/PrinterList';
import { usePrinters } from '../contexts/AppContext';

/**
 * Page component for the Printers view
 * Uses PrintersContext to access and manipulate printers data
 */
const PrintersPage: React.FC = () => {
  // Get printers state and functions from context
  const {
    printers,
    addPrinter,
    updatePrinter,
    deletePrinter,
    isLoading,
    error
  } = usePrinters();

  if (isLoading) {
    return <div className="p-4 text-center">Loading printers...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-3">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4">
            {error}
          </div>
        )}
        <PrinterList
          printers={printers}
          onUpdate={updatePrinter}
          onDelete={deletePrinter}
          onAdd={addPrinter}
        />
      </div>
    </div>
  );
};

export default PrintersPage;