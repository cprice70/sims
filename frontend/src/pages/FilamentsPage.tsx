import React from 'react';
import FilamentList from '../components/FilamentList';
import PrintQueue from '../components/PrintQueue';
import PurchaseList from '../components/PurchaseList';
import { Filament } from '../types/filament';
import { PrintQueueItem, Printer } from '../types/printer';
import { PurchaseListItem } from '../types/purchase';

interface FilamentsPageProps {
    filaments: Filament[];
    printQueue: PrintQueueItem[];
    purchaseItems: PurchaseListItem[];
    printers: Printer[];
    onUpdateFilament: (filament: Filament) => void;
    onDeleteFilament: (id: number) => void;
    onRefreshPrintQueue: () => void;
    onRefreshPurchaseItems: () => void;
}

/**
 * Page component for the Filaments view
 */
const FilamentsPage: React.FC<FilamentsPageProps> = ({
    filaments,
    printQueue,
    purchaseItems,
    printers,
    onUpdateFilament,
    onDeleteFilament,
    onRefreshPrintQueue,
    onRefreshPurchaseItems
}) => {
    // Handler for adding a queue item
    const handleAddQueueItem = async (item: PrintQueueItem) => {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/print-queue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            onRefreshPrintQueue();
        } catch (err) {
            console.error('Failed to add queue item', err);
        }
    };

    // Handler for updating a queue item
    const handleUpdateQueueItem = async (item: PrintQueueItem) => {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/print-queue/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            onRefreshPrintQueue();
        } catch (err) {
            console.error('Failed to update queue item', err);
        }
    };

    // Handler for deleting a queue item
    const handleDeleteQueueItem = async (id: number) => {
        if (!confirm('Are you sure you want to delete this queue item?')) return;

        try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/print-queue/${id}`, {
                method: 'DELETE'
            });
            onRefreshPrintQueue();
        } catch (err) {
            console.error('Failed to delete queue item', err);
        }
    };

    // Handler for reordering queue items
    const handleReorderQueueItems = async (items: PrintQueueItem[]) => {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/print-queue/reorder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items })
            });
            onRefreshPrintQueue();
        } catch (err) {
            console.error('Failed to reorder queue items', err);
        }
    };

    // Handler for adding a purchase item
    const handleAddPurchaseItem = async (item: PurchaseListItem) => {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/purchase-list`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            onRefreshPurchaseItems();
        } catch (err) {
            console.error('Failed to add purchase item', err);
        }
    };

    // Handler for updating a purchase item
    const handleUpdatePurchaseItem = async (item: PurchaseListItem) => {
        try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/purchase-list/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(item)
            });
            onRefreshPurchaseItems();
        } catch (err) {
            console.error('Failed to update purchase item', err);
        }
    };

    // Handler for deleting a purchase item
    const handleDeletePurchaseItem = async (id: number) => {
        if (!confirm('Are you sure you want to delete this purchase item?')) return;

        try {
            await fetch(`${process.env.REACT_APP_API_URL}/api/purchase-list/${id}`, {
                method: 'DELETE'
            });
            onRefreshPurchaseItems();
        } catch (err) {
            console.error('Failed to delete purchase item', err);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
                <FilamentList
                    filaments={filaments}
                    onUpdate={onUpdateFilament}
                    onDelete={onDeleteFilament}
                />
            </div>
            <div>
                <PrintQueue
                    items={printQueue}
                    printers={printers}
                    onAdd={handleAddQueueItem}
                    onUpdate={handleUpdateQueueItem}
                    onDelete={handleDeleteQueueItem}
                    onReorder={handleReorderQueueItems}
                />
                <div className="mt-4">
                    <PurchaseList
                        items={purchaseItems}
                        filaments={filaments}
                        onAdd={handleAddPurchaseItem}
                        onUpdate={handleUpdatePurchaseItem}
                        onDelete={handleDeletePurchaseItem}
                    />
                </div>
            </div>
        </div>
    );
};

export default FilamentsPage;