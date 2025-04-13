import { useState, useCallback } from 'react';

type DataItem = { id: number } | { id: string };
type Operation = 'create' | 'update' | 'delete';

interface OptimisticUpdateOptions<T extends DataItem> {
  // Optional key generator for new items (default uses Date.now() * -1)
  generateTempId?: () => number | string;
  // Optional handler to run after an operation (success or failure)
  onCompletion?: (operation: Operation, success: boolean, item?: T) => void;
}

export function useOptimisticUpdate<T extends DataItem>(
  initialItems: T[] = [],
  options: OptimisticUpdateOptions<T> = {}
) {
  const [items, setItems] = useState<T[]>(initialItems);
  const [pendingOperations, setPendingOperations] = useState<{
    [key: string]: Operation;
  }>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateTempId = options.generateTempId || (() => Date.now() * -1);

  // Update local items when initialItems changes (e.g., from props or context)
  const updateItems = useCallback((newItems: T[]) => {
    setItems(newItems);
  }, []);

  // Optimistic create
  const createOptimistically = useCallback(
    async (
      item: Omit<T, 'id'>,
      createFn: (item: Omit<T, 'id'>) => Promise<T>
    ): Promise<T> => {
      setIsProcessing(true);
      setError(null);

      // Generate a temporary ID for the new item
      const tempId = generateTempId();
      const tempItem = {
        ...item,
        id: tempId,
      } as T;

      // Add to list optimistically
      setItems((current) => [...current, tempItem]);

      // Mark as pending
      setPendingOperations((current) => ({
        ...current,
        [tempId.toString()]: 'create',
      }));

      try {
        // Perform actual API call
        const createdItem = await createFn(item);

        // Replace temp item with real one
        setItems((current) =>
          current.map((i) => (i.id === tempId ? createdItem : i))
        );

        options.onCompletion?.('create', true, createdItem);
        return createdItem;
      } catch (err) {
        // On error, remove the temp item
        setItems((current) => current.filter((i) => i.id !== tempId));
        setError(err instanceof Error ? err.message : 'Failed to create item');
        options.onCompletion?.('create', false);
        throw err;
      } finally {
        setIsProcessing(false);
        setPendingOperations((current) => {
          const updated = { ...current };
          delete updated[tempId.toString()];
          return updated;
        });
      }
    },
    [generateTempId]
  );

  // Optimistic update
  const updateOptimistically = useCallback(
    async (item: T, updateFn: (item: T) => Promise<T>): Promise<T> => {
      setIsProcessing(true);
      setError(null);

      const id = item.id.toString();

      // Store original for potential restoration
      const originalItem = items.find((i) => i.id.toString() === id);

      // Mark as pending
      setPendingOperations((current) => ({
        ...current,
        [id]: 'update',
      }));

      // Update optimistically
      setItems((current) =>
        current.map((i) => (i.id.toString() === id ? item : i))
      );

      try {
        // Perform actual API call
        const updatedItem = await updateFn(item);

        // Update with server response
        setItems((current) =>
          current.map((i) => (i.id.toString() === id ? updatedItem : i))
        );

        options.onCompletion?.('update', true, updatedItem);
        return updatedItem;
      } catch (err) {
        // Restore original on error
        if (originalItem) {
          setItems((current) =>
            current.map((i) => (i.id.toString() === id ? originalItem : i))
          );
        }
        setError(err instanceof Error ? err.message : 'Failed to update item');
        options.onCompletion?.('update', false);
        throw err;
      } finally {
        setIsProcessing(false);
        setPendingOperations((current) => {
          const updated = { ...current };
          delete updated[id];
          return updated;
        });
      }
    },
    [items]
  );

  // Optimistic delete
  const deleteOptimistically = useCallback(
    async (id: number | string, deleteFn: () => Promise<void>): Promise<void> => {
      setIsProcessing(true);
      setError(null);

      const idStr = id.toString();

      // Store for potential restoration
      const itemToDelete = items.find((i) => i.id.toString() === idStr);

      // Mark as pending
      setPendingOperations((current) => ({
        ...current,
        [idStr]: 'delete',
      }));

      // Remove optimistically
      setItems((current) => current.filter((i) => i.id.toString() !== idStr));

      try {
        // Perform actual API call
        await deleteFn();
        options.onCompletion?.('delete', true);
      } catch (err) {
        // Restore on error
        if (itemToDelete) {
          setItems((current) => [...current, itemToDelete]);
        }
        setError(err instanceof Error ? err.message : 'Failed to delete item');
        options.onCompletion?.('delete', false);
        throw err;
      } finally {
        setIsProcessing(false);
        setPendingOperations((current) => {
          const updated = { ...current };
          delete updated[idStr];
          return updated;
        });
      }
    },
    [items]
  );

  // Check if an item has a pending operation
  const isPending = useCallback(
    (id: number | string): Operation | null => {
      const idStr = id.toString();
      return pendingOperations[idStr] || null;
    },
    [pendingOperations]
  );

  // Check if any operations are in progress
  const hasPendingOperations = Object.keys(pendingOperations).length > 0;

  return {
    items,
    updateItems,
    createOptimistically,
    updateOptimistically,
    deleteOptimistically,
    isProcessing,
    hasPendingOperations,
    isPending,
    error,
    setError,
    pendingOperations,
  };
}

export default useOptimisticUpdate;