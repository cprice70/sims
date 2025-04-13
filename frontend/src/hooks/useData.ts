import { useState, useEffect, useCallback } from 'react';
import useError from './useError';

interface UseDataOptions<T> {
    initialData?: T;
    loadOnMount?: boolean;
    errorMessage?: string;
}

/**
 * A custom hook for loading, updating, and managing data from an API
 * @param fetchFunction Function to fetch the data
 * @param options Configuration options
 */
const useData = <T,>(
    fetchFunction: () => Promise<T>,
    options: UseDataOptions<T> = {}
) => {
    const {
        initialData,
        loadOnMount = true,
        errorMessage = 'Failed to load data'
    } = options;

    const [data, setData] = useState<T | undefined>(initialData);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const { error, handleError, clearError } = useError();

    /**
     * Load data from the API
     */
    const loadData = useCallback(async () => {
        setIsLoading(true);
        clearError();

        try {
            const result = await fetchFunction();
            setData(result);
            setIsLoaded(true);
            return result;
        } catch (err) {
            handleError(err, errorMessage);
            return undefined;
        } finally {
            setIsLoading(false);
        }
    }, [fetchFunction, handleError, clearError, errorMessage]);

    /**
     * Update the local data without fetching from the API
     */
    const updateData = useCallback((newData: T | ((prevData: T | undefined) => T)) => {
        setData(prevData => {
            if (typeof newData === 'function') {
                return (newData as ((prevData: T | undefined) => T))(prevData);
            }
            return newData;
        });
    }, []);

    // Load data on mount if option is enabled
    useEffect(() => {
        if (loadOnMount) {
            loadData();
        }
    }, [loadOnMount, loadData]);

    return {
        data,
        isLoading,
        isLoaded,
        error,
        loadData,
        updateData,
    };
};

export default useData;