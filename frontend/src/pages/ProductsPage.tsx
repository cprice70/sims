import React from 'react';
import ProductList from '../components/ProductList';
import { ProductWithCalculations } from '../types/product';
import { useProducts, useSettings } from '../contexts/AppContext';

/**
 * Page component for the Products view
 * Uses context for products and settings data
 */
const ProductsPage: React.FC = () => {
  // Get products and related functions from context
  const { 
    products, 
    updateProduct, 
    deleteProduct,
    isLoading: productsLoading,
    error: productsError
  } = useProducts();
  
  // Get settings from context
  const { 
    settings, 
    updateSettings,
    isLoading: settingsLoading,
    error: settingsError 
  } = useSettings();

  const isLoading = productsLoading || settingsLoading;
  const error = productsError || settingsError;

  if (isLoading) {
    return <div className="p-4 text-center">Loading products...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-4">
        <div className="flex flex-col space-y-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3">
              {error}
            </div>
          )}
          <ProductList
            products={products}
            onUpdate={updateProduct}
            onDelete={deleteProduct}
            hourlyRate={settings.hourly_rate}
            wearTearPercentage={settings.wear_tear_markup}
            platformFees={settings.platform_fees}
            filamentSpoolPrice={settings.filament_spool_price}
            desiredProfitMargin={settings.desired_profit_margin}
            packagingCost={settings.packaging_cost}
            onUpdateSettings={updateSettings}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;