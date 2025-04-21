import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';

// Components
import Navigation from './components/Navigation';
import FilamentForm from './components/FilamentForm';
import PartForm from './components/PartForm';
import ProductForm from './components/ProductForm';
import ErrorDisplay from './components/ErrorDisplay';
import LoadingScreen from './components/LoadingScreen';

// Pages
import FilamentsPage from './pages/FilamentsPage';
import PartsPage from './pages/PartsPage';
import PrintersPage from './pages/PrintersPage';
import ProductsPage from './pages/ProductsPage';
import SettingsPage from './pages/SettingsPage';

// Types
import { Product } from './types/product';
import { Part } from './types/part';
import { Filament } from './types/filament';

// Contexts
import { 
  useSettings, 
  useFilaments, 
  useProducts,
  useParts
} from './contexts/AppContext';

type ViewType = 'filaments' | 'parts' | 'printers' | 'products' | 'settings';

const App = () => {
  // State from contexts
  const { settings, isLoading: settingsLoading, error: settingsError } = useSettings();
  const { filaments, addFilament, isLoading: filamentsLoading, error: filamentsError } = useFilaments();
  const { products, isLoading: productsLoading, error: productsError } = useProducts();
  const { parts, addPart, isLoading: partsLoading, error: partsError } = useParts();
  
  // Local state
  const [activeView, setActiveView] = useState<ViewType>('filaments');
  const [isAddingFilament, setIsAddingFilament] = useState(false);
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Loading state
  const isLoading = settingsLoading || filamentsLoading || productsLoading || partsLoading;
  
  // Set active view based on URL path
  useEffect(() => {
    const path = location.pathname.slice(1) || 'filaments';
    if (['filaments', 'parts', 'printers', 'products', 'settings'].includes(path)) {
      setActiveView(path as ViewType);
    } else {
      navigate('/filaments');
    }
  }, [location.pathname, navigate]);
  
  // Handler for navigation
  const handleViewChange = useCallback((view: ViewType) => {
    setActiveView(view);
  }, []);
  
  // Handler for the "NEW" button
  const handleAddButtonClick = useCallback(() => {
    if (activeView === 'parts') setIsAddingPart(true);
    else if (activeView === 'filaments') setIsAddingFilament(true);
    else if (activeView === 'products') setIsAddingProduct(true);
  }, [activeView]);
  
  // Handler for adding a filament
  const handleAddFilament = useCallback(async (filament: Filament) => {
    try {
      await addFilament(filament);
      setIsAddingFilament(false);
    } catch (err) {
      // Error is handled in the context
    }
  }, [addFilament]);
  
  // Handler for adding a part
  const handleAddPart = useCallback(async (part: Part) => {
    try {
      await addPart(part);
      setIsAddingPart(false);
    } catch (err) {
      // Error is handled in the context
    }
  }, [addPart]);
  
  // Handler for adding a product
  const handleAddProduct = useCallback(async (product: Product) => {
    try {
      // Get addProduct from context
      const { addProduct } = useProducts();
      await addProduct(product);
      setIsAddingProduct(false);
    } catch (err) {
      // Error is handled in the context
    }
  }, []);
  
  if (isLoading) {
    return <LoadingScreen message="INITIALIZING SIMS..." />;
  }

  // Error handling: show error if any context has an error
  const error = settingsError || filamentsError || productsError || partsError;
  if (error) {
    return <ErrorDisplay error={error} />;
  }
  
  return (
    <div className="min-h-screen bg-white sm:p-8 font-mono">
      <div className="w-full">
        <div className="flex flex-col space-y-0 sm:space-y-4">
          {/* Navigation Bar */}
          <Navigation 
            activeView={activeView} 
            onViewChange={handleViewChange} 
            onAddClick={handleAddButtonClick} 
          />
          
          {/* Forms */}
          {isAddingFilament && activeView === 'filaments' && (
            <FilamentForm
              isOpen={isAddingFilament}
              onSubmit={handleAddFilament}
              onClose={() => setIsAddingFilament(false)}
            />
          )}
          
          {isAddingPart && activeView === 'parts' && (
            <PartForm
              isOpen={isAddingPart}
              printers={[]} // Printers will be fetched from context in the component
              onSubmit={handleAddPart}
              onClose={() => setIsAddingPart(false)}
            />
          )}
          
          {isAddingProduct && activeView === 'products' && (
            <ProductForm
              product={null}
              isOpen={isAddingProduct}
              onSubmit={handleAddProduct}
              onClose={() => setIsAddingProduct(false)}
              hourlyRate={settings.hourly_rate}
              wearTearPercentage={settings.wear_tear_markup}
              platformFees={settings.platform_fees}
              filamentSpoolPrice={settings.filament_spool_price}
              desiredProfitMargin={settings.desired_profit_margin}
              packagingCost={settings.packaging_cost}
            />
          )}
          
          {editingProduct && (
            <ProductForm
              product={editingProduct}
              isOpen={!!editingProduct}
              onSubmit={async (product) => {
                try {
                  const { updateProduct } = useProducts();
                  await updateProduct(product);
                  setEditingProduct(null);
                } catch (err) {
                  // Error is handled in the context
                }
              }}
              onClose={() => setEditingProduct(null)}
              hourlyRate={settings.hourly_rate}
              wearTearPercentage={settings.wear_tear_markup}
              platformFees={settings.platform_fees}
              filamentSpoolPrice={settings.filament_spool_price}
              desiredProfitMargin={settings.desired_profit_margin}
              packagingCost={settings.packaging_cost}
            />
          )}
          
          {/* Router for main content */}
          <Routes>
            <Route path="/" element={<FilamentsPage />} />
            <Route path="/filaments" element={<FilamentsPage />} />
            <Route path="/parts" element={<PartsPage />} />
            <Route path="/printers" element={<PrintersPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;