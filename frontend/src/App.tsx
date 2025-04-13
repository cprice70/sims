import { useState, useEffect, useCallback } from 'react';
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
import { Filament } from './types/filament';
import { Product } from './types/product';

// Hooks
import useError from './hooks/useError';
import useData from './hooks/useData';

// API Services
import * as api from './services/api';

// Utils
import { calculateProductsMargins } from './utils/calculations';

type ViewType = 'filaments' | 'parts' | 'printers' | 'products' | 'settings';

const App = () => {
  const [activeView, setActiveView] = useState<ViewType>('filaments');
  const [isAddingFilament, setIsAddingFilament] = useState(false);
  const [isAddingPart, setIsAddingPart] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { error, setError, clearError } = useError(5000); // Auto-clear errors after 5 seconds

  // Load data using custom hooks
  const {
    data: filaments,
    loadData: loadFilaments,
    updateData: updateFilaments
  } = useData<Filament[]>(api.fetchFilaments, {
    initialData: [],
    errorMessage: 'Failed to load filaments'
  });

  const {
    data: printers,
    loadData: loadPrinters
  } = useData(api.fetchPrinters, {
    initialData: [],
    errorMessage: 'Failed to load printers'
  });

  const {
    data: parts,
    loadData: loadParts
  } = useData(api.fetchParts, {
    initialData: [],
    errorMessage: 'Failed to load parts'
  });

  const {
    data: printQueue,
    loadData: loadPrintQueue
  } = useData(api.fetchPrintQueue, {
    initialData: [],
    errorMessage: 'Failed to load print queue'
  });

  const {
    data: purchaseItems,
    loadData: loadPurchaseItems
  } = useData(api.fetchPurchaseItems, {
    initialData: [],
    errorMessage: 'Failed to load purchase items'
  });

  const {
    data: settings,
    loadData: loadSettings,
    updateData: updateSettingsData
  } = useData<api.Settings>(api.fetchSettings, {
    initialData: {
      spool_weight: 1000,
      filament_markup: 20,
      hourly_rate: 20,
      wear_tear_markup: 5,
      platform_fees: 7,
      filament_spool_price: 18,
      desired_profit_margin: 55,
      packaging_cost: 0.5
    },
    errorMessage: 'Failed to load settings'
  });

  const {
    data: rawProducts,
    loadData: loadRawProducts,
    updateData: updateRawProducts
  } = useData<Product[]>(api.fetchProducts, {
    initialData: [],
    errorMessage: 'Failed to load products'
  });

  // Derived state - calculate product margins based on settings
  const products = rawProducts && settings
    ? calculateProductsMargins(rawProducts, settings)
    : [];

  // Set active view based on URL path
  useEffect(() => {
    const path = location.pathname.slice(1) || 'filaments';
    if (['filaments', 'parts', 'printers', 'products', 'settings'].includes(path)) {
      setActiveView(path as ViewType);

      // Refetch data when route changes to ensure content updates
      if (path === 'filaments') loadFilaments();
      if (path === 'parts') loadParts();
      if (path === 'printers') loadPrinters();
      if (path === 'products') loadRawProducts();
      if (path === 'settings') loadSettings();
    } else {
      navigate('/filaments');
    }
  }, [location.pathname, navigate, loadFilaments, loadParts, loadPrinters, loadRawProducts, loadSettings]);

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
      const newFilament = await api.addFilament(filament);
      updateFilaments(prev => [...(prev || []), newFilament]);
      setIsAddingFilament(false);
      clearError();
    } catch (err) {
      setError('Failed to add filament');
    }
  }, [updateFilaments, clearError, setError]);

  // Handler for updating a filament
  const handleUpdateFilament = useCallback(async (filament: Filament) => {
    try {
      const updatedFilament = await api.updateFilament(filament);
      updateFilaments(prev =>
        (prev || []).map(f => f.id === updatedFilament.id ? updatedFilament : f)
      );
      clearError();

      // Products may use this filament, so refresh products too
      loadRawProducts();
    } catch (err) {
      setError('Failed to update filament');
    }
  }, [updateFilaments, clearError, setError, loadRawProducts]);

  // Handler for deleting a filament
  const handleDeleteFilament = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this filament?')) return;

    try {
      await api.deleteFilament(id);
      updateFilaments(prev => (prev || []).filter(f => f.id !== id));
      clearError();

      // Products may use this filament, so refresh products too
      loadRawProducts();
    } catch (err) {
      setError('Failed to delete filament');
    }
  }, [updateFilaments, clearError, setError, loadRawProducts]);

  // Handler for adding a part
  const handleAddPart = useCallback(async (part: api.Part) => {
    try {
      await api.addPart(part);
      loadParts();
      setIsAddingPart(false);
      clearError();
    } catch (err) {
      setError('Failed to add part');
    }
  }, [loadParts, clearError, setError]);

  // Handler for adding a product
  const handleAddProduct = useCallback(async (product: Product) => {
    try {
      await api.addProduct(product);
      loadRawProducts();
      setIsAddingProduct(false);
      clearError();
    } catch (err) {
      setError('Failed to add product');
    }
  }, [loadRawProducts, clearError, setError]);

  // Handler for updating a product
  const handleUpdateProduct = useCallback(async (product: Product) => {
    try {
      await api.updateProduct(product);
      loadRawProducts();
      setEditingProduct(null);
      clearError();
    } catch (err) {
      setError('Failed to update product');
    }
  }, [loadRawProducts, clearError, setError]);

  // Handler for deleting a product
  const handleDeleteProduct = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await api.deleteProduct(id);
      updateRawProducts(prev => (prev || []).filter(p => p.id !== id));
      clearError();
    } catch (err) {
      setError('Failed to delete product');
    }
  }, [updateRawProducts, clearError, setError]);

  // Handler for updating settings
  const handleUpdateSettings = useCallback(async (newSettings: api.Settings) => {
    try {
      const updatedSettings = await api.updateSettings(newSettings);
      updateSettingsData(updatedSettings);
      clearError();

      // Recalculate product margins with the new settings
      if (rawProducts) {
        const updatedProducts = calculateProductsMargins(rawProducts, updatedSettings);
        updateRawProducts(updatedProducts);
      }

      return updatedSettings;
    } catch (err) {
      setError('Failed to update settings');
      throw err;
    }
  }, [updateSettingsData, rawProducts, updateRawProducts, clearError, setError]);

  // Check if any required data is still loading
  const isLoading =
    !filaments ||
    !printers ||
    !parts ||
    !printQueue ||
    !purchaseItems ||
    !settings ||
    !rawProducts;

  if (isLoading) {
    return <LoadingScreen message="INITIALIZING SIMS..." />;
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

          {/* Error Display */}
          {error && <ErrorDisplay error={error} onClose={clearError} />}

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
              printers={printers.filter(p => p.id !== undefined) as any}
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
              onSubmit={handleUpdateProduct}
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
            <Route
              path="/"
              element={
                <FilamentsPage
                  filaments={filaments}
                  printQueue={printQueue}
                  purchaseItems={purchaseItems}
                  printers={printers}
                  onUpdateFilament={handleUpdateFilament}
                  onDeleteFilament={handleDeleteFilament}
                  onRefreshPrintQueue={loadPrintQueue}
                  onRefreshPurchaseItems={loadPurchaseItems}
                />
              }
            />
            <Route
              path="/filaments"
              element={
                <FilamentsPage
                  filaments={filaments}
                  printQueue={printQueue}
                  purchaseItems={purchaseItems}
                  printers={printers}
                  onUpdateFilament={handleUpdateFilament}
                  onDeleteFilament={handleDeleteFilament}
                  onRefreshPrintQueue={loadPrintQueue}
                  onRefreshPurchaseItems={loadPurchaseItems}
                />
              }
            />
            <Route
              path="/parts"
              element={
                <PartsPage
                  parts={parts}
                  printers={printers}
                  onUpdatePart={loadParts}
                  onDeletePart={loadParts}
                />
              }
            />
            <Route
              path="/printers"
              element={
                <PrintersPage
                  printers={printers}
                  onUpdate={loadPrinters}
                  onDelete={loadPrinters}
                  onAdd={loadPrinters}
                />
              }
            />
            <Route
              path="/products"
              element={
                <ProductsPage
                  products={products}
                  onUpdate={(product) => setEditingProduct(product)}
                  onDelete={handleDeleteProduct}
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                />
              }
            />
            <Route
              path="/settings"
              element={
                <SettingsPage
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                />
              }
            />
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;