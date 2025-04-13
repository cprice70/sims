import React from 'react';
import PartList from '../components/PartList';
import { useParts, usePrinters } from '../contexts/AppContext';

/**
 * Page component for the Parts view
 * Uses both PartsContext and PrintersContext
 */
const PartsPage: React.FC = () => {
  // Get parts state and functions from context
  const {
    parts,
    addPart,
    updatePart,
    deletePart,
    isLoading: partsLoading,
    error: partsError
  } = useParts();

  // Get printers from context (needed for part associations)
  const {
    printers,
    isLoading: printersLoading,
    error: printersError
  } = usePrinters();

  const isLoading = partsLoading || printersLoading;
  const error = partsError || printersError;

  if (isLoading) {
    return <div className="p-4 text-center">Loading parts...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-3">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 mb-4">
            {error}
          </div>
        )}
        <PartList
          parts={parts}
          printers={printers.filter(p => p.id !== undefined) as { id: number; name: string }[]}
          onUpdatePart={updatePart}
          onDeletePart={deletePart}
        />
      </div>
    </div>
  );
};

export default PartsPage;