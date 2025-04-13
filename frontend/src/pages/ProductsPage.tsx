import React from 'react';
import ProductList from '../components/ProductList';
import { ProductWithCalculations } from '../types/product';
import { Settings } from '../services/api';

interface ProductsPageProps {
  products: ProductWithCalculations[];
  settings: Settings;
  onUpdate: (product: ProductWithCalculations) => void;
  onDelete: (id: number) => void;
  onUpdateSettings: (settings: Settings) => Promise<Settings>;
}

/**
 * Page component for the Products view
 */
const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  settings,
  onUpdate,
  onDelete,
  onUpdateSettings
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-4">
        <div className="flex flex-col space-y-4">
          <ProductList
            products={products}
            onUpdate={onUpdate}
            onDelete={onDelete}
            hourlyRate={settings.hourly_rate}
            wearTearPercentage={settings.wear_tear_markup}
            platformFees={settings.platform_fees}
            filamentSpoolPrice={settings.filament_spool_price}
            desiredProfitMargin={settings.desired_profit_margin}
            packagingCost={settings.packaging_cost}
            onUpdateSettings={onUpdateSettings}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;