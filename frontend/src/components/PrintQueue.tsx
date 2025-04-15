import { useState, useRef, useEffect } from 'react';
import { PrintQueueItem, Printer } from '../types/printer';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface PrintQueueProps {
    items: PrintQueueItem[];
    printers: Printer[];
    onAdd: (item: PrintQueueItem) => void;
    onUpdate: (item: PrintQueueItem) => void;
    onDelete: (id: number) => void;
    onReorder: (items: PrintQueueItem[]) => void;
}

type DragItem = {
    index: number;
    id: number;
    type: string;
}

const ItemTypes = {
    QUEUE_ITEM: 'queueItem',
};

interface QueueItemProps {
    item: PrintQueueItem;
    printers: Printer[];
    index: number;
    onUpdate: (item: PrintQueueItem) => void;
    onDelete: (id: number) => void;
    moveItem: (dragIndex: number, hoverIndex: number) => void;
}

const QueueItem = ({ item, printers, index, onUpdate, onDelete, moveItem }: QueueItemProps) => {
    const ref = useRef<HTMLDivElement>(null);
    
    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes.QUEUE_ITEM,
        item: () => ({ id: item.id, index, type: ItemTypes.QUEUE_ITEM }),
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });
    
    const [, drop] = useDrop({
        accept: ItemTypes.QUEUE_ITEM,
        hover: (draggedItem: DragItem, monitor) => {
            if (!ref.current) {
                return;
            }
            
            const dragIndex = draggedItem.index;
            const hoverIndex = index;
            
            // Don't replace items with themselves
            if (dragIndex === hoverIndex) {
                return;
            }
            
            // Determine rectangle on screen
            const hoverBoundingRect = ref.current?.getBoundingClientRect();
            
            // Get vertical middle
            const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
            
            // Determine mouse position
            const clientOffset = monitor.getClientOffset();
            
            // Get pixels to the top
            const hoverClientY = (clientOffset?.y ?? 0) - hoverBoundingRect.top;
            
            // Only perform the move when the mouse has crossed half of the item's height
            // When dragging downwards, only move when the cursor is below 50%
            // When dragging upwards, only move when the cursor is above 50%
            
            // Dragging downwards
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return;
            }
            
            // Dragging upwards
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return;
            }
            
            // Time to actually perform the action
            moveItem(dragIndex, hoverIndex);
            
            // Note: we're mutating the monitor item here!
            // Generally it's better to avoid mutations,
            // but it's good here for the sake of performance
            // to avoid expensive index searches.
            draggedItem.index = hoverIndex;
        },
    });
    
    drag(drop(ref));
    
    return (
        <div 
            ref={ref} 
            className={`p-2 ${isDragging ? 'opacity-50 bg-gray-100' : ''}`}
            style={{ cursor: 'move' }}
        >
            <div className="flex justify-between items-start">
                <div className="overflow-hidden truncate">
                    <div className="font-medium">{item.item_name}</div>
                </div>
                <div className="flex space-x-2">
                    <select
                        value={item.printer_id || ''}
                        onChange={(e) => onUpdate({ ...item, printer_id: e.target.value ? Number(e.target.value) : undefined })}
                        className="text-xs border border-black px-1 py-1 w-28 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:6px_6px] bg-[right_4px_center] bg-no-repeat pr-4 overflow-hidden"
                    >
                        <option value="">No Printer</option>
                        {printers.map((printer) => (
                            <option key={printer.id} value={printer.id} className="truncate">
                                {printer.name.length > 15 ? printer.name.substring(0, 15) + '...' : printer.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={item.status}
                        onChange={(e) => onUpdate({ ...item, status: e.target.value as PrintQueueItem['status'] })}
                        className="text-xs border border-black px-1 py-1 w-20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:6px_6px] bg-[right_4px_center] bg-no-repeat pr-4 overflow-hidden"
                    >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                    <button
                        onClick={() => item.id && onDelete(item.id)}
                        className="w-6 h-6 flex items-center justify-center border border-black text-white bg-red-600 hover:bg-red-700 flex-shrink-0"
                    >
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function PrintQueue({ items, printers, onAdd, onUpdate, onDelete, onReorder }: PrintQueueProps) {
    const [newItem, setNewItem] = useState('');
    const [selectedPrinter, setSelectedPrinter] = useState<number | undefined>();
    const [queueItems, setQueueItems] = useState<PrintQueueItem[]>([]);

    // Update local state when props change
    useEffect(() => {
        setQueueItems(items);
    }, [items]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItem.trim()) return;

        onAdd({
            item_name: newItem.trim(),
            printer_id: selectedPrinter,
            status: 'pending'
        });

        setNewItem('');
        setSelectedPrinter(undefined);
    };

    const moveItem = (dragIndex: number, hoverIndex: number) => {
        const dragItem = queueItems[dragIndex];
        const newItems = [...queueItems];
        newItems.splice(dragIndex, 1);
        newItems.splice(hoverIndex, 0, dragItem);
        
        setQueueItems(newItems);
    };

    // Trigger reorder API call when drops are completed
    useEffect(() => {
        // Only trigger if the queue items are different from the original items
        if (queueItems.length > 0 && 
            items.length > 0 && 
            JSON.stringify(queueItems.map(i => i.id)) !== JSON.stringify(items.map(i => i.id))) {
            onReorder(queueItems);
        }
    }, [queueItems]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-4">
            <div className="bg-white border-2 border-black">
                <div className="p-4 bg-black text-white">
                    <h2 className="text-lg font-medium tracking-wider">PRINT QUEUE</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-4 pr-16 border-b-2 border-black">
                    <div className="space-y-3">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={newItem}
                                onChange={(e) => setNewItem(e.target.value)}
                                placeholder="Enter print item"
                                className="flex-1 px-3 py-2 border-2 border-black text-sm"
                            />
                            <select
                                value={selectedPrinter || ''}
                                onChange={(e) => setSelectedPrinter(e.target.value ? Number(e.target.value) : undefined)}
                                className="w-36 px-3 py-2 border-2 border-black text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23000000%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:8px_8px] bg-[right_8px_center] bg-no-repeat pr-8"
                            >
                                <option value="">Printer (Optional)</option>
                                {printers.map((printer) => (
                                    <option key={printer.id} value={printer.id}>
                                        {printer.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider"
                        >
                            Add to Queue
                        </button>
                    </div>
                </form>

                <DndProvider backend={HTML5Backend} options={{ enableTouchEvents: true }}>
                    <div className="divide-y-2 divide-black">
                        {queueItems.map((item, index) => (
                            <QueueItem
                                key={item.id}
                                item={item}
                                printers={printers}
                                index={index}
                                onUpdate={onUpdate}
                                onDelete={onDelete}
                                moveItem={moveItem}
                            />
                        ))}
                        {queueItems.length === 0 && (
                            <div className="p-4 text-sm text-gray-500">
                                No items in the print queue
                            </div>
                        )}
                    </div>
                </DndProvider>
            </div>
        </div>
    );
} 