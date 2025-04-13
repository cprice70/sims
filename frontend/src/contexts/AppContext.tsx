import React, { ReactNode } from 'react';
import { SettingsProvider } from './SettingsContext';
import { ProductsProvider } from './ProductsContext';
import { FilamentsProvider } from './FilamentsContext';
import { PrintersProvider } from './PrintersContext';
import { PrintQueueProvider } from './PrintQueueContext';
import { PurchaseListProvider } from './PurchaseListContext';
import { PartsProvider } from './PartsContext';

interface AppProviderProps {
  children: ReactNode;
}

/**
 * Combined provider that wraps multiple context providers
 * This is the main provider to be used at the top level of the app
 */
export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <SettingsProvider>
      <PrintersProvider>
        <PrintQueueProvider>
          <PurchaseListProvider>
            <PartsProvider>
              <FilamentsProvider>
                <ProductsProvider>
                  {children}
                </ProductsProvider>
              </FilamentsProvider>
            </PartsProvider>
          </PurchaseListProvider>
        </PrintQueueProvider>
      </PrintersProvider>
    </SettingsProvider>
  );
};

// Export all the individual hooks for convenience
export { useSettings } from './SettingsContext';
export { useFilaments } from './FilamentsContext';
export { useProducts } from './ProductsContext';
export { usePrinters } from './PrintersContext';
export { usePrintQueue } from './PrintQueueContext';
export { usePurchaseList } from './PurchaseListContext';
export { useParts } from './PartsContext';