import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Product, ProductWithCalculations } from '../types/product';
import { fetchProducts, addProduct, updateProduct, deleteProduct } from '../services/api';
import { useSettings } from './SettingsContext';
import { calculateProductsMargins } from '../utils/calculations';

interface ProductsContextType {
  products: ProductWithCalculations[];
  rawProducts: Product[];
  isLoading: boolean;
  error: string | null;
  isUpdating: boolean;
  pendingChanges: { [key: number]: 'update' | 'delete' } | null;
  refreshProducts: () => Promise<void>;
  addProduct: (product: Product) => Promise<Product>;
  updateProduct: (product: Product) => Promise<Product>;
  deleteProduct: (id: number) => Promise<void>;
}

// Create the context with default values
const ProductsContext = createContext<ProductsContextType>({
  products: [],
  rawProducts: [],
  isLoading: false,
  error: null,
  isUpdating: false,
  pendingChanges: null,
  refreshProducts: async () => {},
  addProduct: async () => ({ id: 0 } as Product),
  updateProduct: async () => ({ id: 0 } as Product),
  deleteProduct: async () => {}
});

// Custom hook for consuming the context
export const useProducts = () => useContext(ProductsContext);

interface ProductsProviderProps {
  children: ReactNode;
}

// Provider component for products data
export const ProductsProvider: React.FC<ProductsProviderProps> = ({ children }) => {
  const [rawProducts, setRawProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [pendingChanges, setPendingChanges] = useState<{ [key: number]: 'update' | 'delete' } | null>(null);
  
  // Get settings from SettingsContext to calculate product margins
  const { settings } = useSettings();
  
  // Calculate products with margins based on settings and raw products
  const products = calculateProductsMargins(rawProducts, settings);

  // Function to refresh products from the API
  const refreshProducts = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const loadedProducts = await fetchProducts();
      setRawProducts(loadedProducts);
    } catch (err) {
      setError('Failed to load products');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load products on mount
  useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);

  // Function to add a product with optimistic update
  const handleAddProduct = async (product: Product): Promise<Product> => {
    setIsUpdating(true);
    setError(null);
    
    // Generate temporary ID for optimistic update
    const tempId = Date.now() * -1; // Use negative IDs for temporary items
    const tempProduct: Product = {
      ...product,
      id: tempId,
      // Add required fields that might be generated server-side
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Optimistically add to UI
    setRawProducts(prev => [...prev, tempProduct]);
    
    try {
      // Perform actual API call
      const newProduct = await addProduct(product);
      
      // Replace temporary product with real one from server
      setRawProducts(prev => 
        prev.map(p => p.id === tempId ? newProduct : p)
      );
      
      return newProduct;
    } catch (err) {
      // On error, remove the temporary product
      setRawProducts(prev => prev.filter(p => p.id !== tempId));
      setError('Failed to add product');
      console.error(err);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to update a product with optimistic update
  const handleUpdateProduct = async (product: Product): Promise<Product> => {
    if (!product.id) {
      throw new Error('Product ID is required for update');
    }
    
    setIsUpdating(true);
    setError(null);
    
    // Mark this product as being updated
    setPendingChanges(prev => ({ ...prev, [product.id as number]: 'update' }));
    
    // Store original product for potential restoration
    const originalProduct = rawProducts.find(p => p.id === product.id);
    
    // Optimistically update in UI
    const optimisticProduct = {
      ...product,
      updated_at: new Date().toISOString()
    };
    
    setRawProducts(prev => 
      prev.map(p => p.id === product.id ? optimisticProduct : p)
    );
    
    try {
      // Perform actual API call
      const updatedProduct = await updateProduct(product);
      
      // Update with the server's response
      setRawProducts(prev => 
        prev.map(p => p.id === updatedProduct.id ? updatedProduct : p)
      );
      
      return updatedProduct;
    } catch (err) {
      // On error, restore original product if available
      if (originalProduct) {
        setRawProducts(prev => 
          prev.map(p => p.id === product.id ? originalProduct : p)
        );
      } else {
        // If we can't restore, refresh from server
        refreshProducts();
      }
      
      setError('Failed to update product');
      console.error(err);
      throw err;
    } finally {
      setIsUpdating(false);
      setPendingChanges(prev => {
        if (!prev) return null;
        const updated = { ...prev };
        delete updated[product.id as number];
        return Object.keys(updated).length > 0 ? updated : null;
      });
    }
  };

  // Function to delete a product with optimistic update
  const handleDeleteProduct = async (id: number): Promise<void> => {
    setIsUpdating(true);
    setError(null);
    
    // Mark this product as being deleted
    setPendingChanges(prev => ({ ...prev, [id]: 'delete' }));
    
    // Store the product for potential restoration
    const productToDelete = rawProducts.find(p => p.id === id);
    
    // Optimistically remove from UI
    setRawProducts(prev => prev.filter(p => p.id !== id));
    
    try {
      // Perform actual API call
      await deleteProduct(id);
      // Nothing to do on success, already removed
    } catch (err) {
      // On error, restore the product
      if (productToDelete) {
        setRawProducts(prev => [...prev, productToDelete]);
      } else {
        // If we can't restore, refresh from server
        refreshProducts();
      }
      setError('Failed to delete product');
      console.error(err);
      throw err;
    } finally {
      setIsUpdating(false);
      setPendingChanges(prev => {
        if (!prev) return null;
        const updated = { ...prev };
        delete updated[id];
        return Object.keys(updated).length > 0 ? updated : null;
      });
    }
  };

  // Value provided to consumers of the context
  const value: ProductsContextType = {
    products,
    rawProducts,
    isLoading,
    error,
    isUpdating,
    pendingChanges,
    refreshProducts,
    addProduct: handleAddProduct,
    updateProduct: handleUpdateProduct,
    deleteProduct: handleDeleteProduct
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};

export default ProductsContext;