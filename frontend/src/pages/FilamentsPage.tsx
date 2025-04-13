import React from 'react';
import FilamentList from '../components/FilamentList';
import PrintQueue from '../components/PrintQueue';
import PurchaseList from '../components/PurchaseList';
import {
  useFilaments,
  usePrintQueue,
  usePurchaseList,
  usePrinters
} from '../contexts/AppContext';

/**
 * Page component for the Filaments view
 * Fully uses contexts for all data and operations
 */
const FilamentsPage: React.FC = () => {
  // Get filaments data and functions from context
  const {
    filaments,
    updateFilament,
    deleteFilament,
    isLoading: filamentsLoading,
    error: filamentsError
  } = useFilaments();

  // Get print queue data and functions from context
  const {
    items: printQueue,
    addQueueItem,
    updateQueueItem,
    deleteQueueItem,
    reorderQueueItems,
    isLoading: queueLoading,
    error: queueError
  } = usePrintQueue();

  // Get purchase list data and functions from context
  const {
    items: purchaseItems,
    addItem: addPurchaseItem,
    updateItem: updatePurchaseItem,
    deleteItem: deletePurchaseItem,
    isLoading: purchaseLoading,
    error: purchaseError
  } = usePurchaseList();

  // Get printers data from context (needed for print queue)
  const {
    printers,
    isLoading: printersLoading,
    error: printersError
  } = usePrinters();

  // Combine loading and error states
  const isLoading = filamentsLoading || queueLoading || purchaseLoading || printersLoading;
  const error = filamentsError || queueError || purchaseError || printersError;

  if (isLoading) {
    return <div className="p-4 text-center">Loading filaments...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {error && (
        <div className="col-span-full mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3">
          {error}
        </div>
      )}
      <div className="lg:col-span-3">
        <FilamentList
          filaments={filaments}
          onUpdate={updateFilament}
          onDelete={deleteFilament}
        />
      </div>
      <div>
        <PrintQueue
          items={printQueue}
          printers={printers}
          onAdd={addQueueItem}
          onUpdate={updateQueueItem}
          onDelete={deleteQueueItem}
          onReorder={reorderQueueItems}
        />
        <div className="mt-4">
          <PurchaseList
            items={purchaseItems}
            filaments={filaments}
            onAdd={addPurchaseItem}
            onUpdate={updatePurchaseItem}
            onDelete={deletePurchaseItem}
          />
        </div>
      </div>
    </div>
  );
};

export default FilamentsPage;