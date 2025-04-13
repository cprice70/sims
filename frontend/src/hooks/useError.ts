import { useState, useCallback } from 'react';

/**
 * Custom hook for managing errors with auto-clearing functionality
 * @param timeout Optional timeout in milliseconds to automatically clear errors
 */
export const useError = (timeout?: number) => {
    const [error, setError] = useState<string | null>(null);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const setErrorWithTimeout = useCallback((message: string) => {
        setError(message);

        if (timeout) {
            setTimeout(() => {
                setError(null);
            }, timeout);
        }
    }, [timeout]);

    /**
     * Handles errors from async operations
     * @param err The error object
     * @param fallbackMessage Optional fallback message if error doesn't have a message
     */
    const handleError = useCallback((err: unknown, fallbackMessage?: string) => {
        const message =
            err instanceof Error ? err.message :
                typeof err === 'string' ? err :
                    fallbackMessage || 'An unknown error occurred';

        setErrorWithTimeout(message);

        // Log the full error to console for debugging
        console.error(err);
    }, [setErrorWithTimeout]);

    /**
     * Wraps an async function to handle any errors it might throw
     * @param fn The async function to wrap
     * @param fallbackMessage Optional fallback message if error doesn't have a message
     */
    const withErrorHandling = useCallback(
        <T extends any[], R>(
            fn: (...args: T) => Promise<R>,
            fallbackMessage?: string
        ) => {
            return async (...args: T): Promise<R | undefined> => {
                try {
                    return await fn(...args);
                } catch (err) {
                    handleError(err, fallbackMessage);
                    return undefined;
                }
            };
        },
        [handleError]
    );

    return {
        error,
        setError: setErrorWithTimeout,
        clearError,
        handleError,
        withErrorHandling,
    };
};

export default useError;