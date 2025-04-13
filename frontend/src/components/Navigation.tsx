import { Link } from 'react-router-dom';

type ViewType = 'filaments' | 'parts' | 'printers' | 'products' | 'settings';

interface NavigationProps {
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onAddClick: () => void;
}

const Navigation = ({ activeView, onViewChange, onAddClick }: NavigationProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-black border-2 border-black p-4 space-y-4 sm:space-y-0">
      <div className="w-1/4">
        <div className="flex flex-col sm:flex-row sm:items-baseline space-y-2 sm:space-y-0 sm:space-x-4">
          <h1 className="text-2xl font-medium tracking-wider text-white">SIMS TERMINAL v1.0</h1>
        </div>
      </div>
      <div className="flex justify-center w-1/2">
        <div className="flex space-x-2">
          <Link
            to="/filaments"
            onClick={() => onViewChange('filaments')}
            className={`w-auto px-4 py-2 border border-black rounded-none text-xs font-bold text-white ${activeView === 'filaments' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} focus:outline-none focus:ring-1 focus:ring-black transition-colors uppercase tracking-wider`}
          >
            FILAMENTS
          </Link>
          <Link
            to="/parts"
            onClick={() => onViewChange('parts')}
            className={`w-auto px-4 py-2 border border-black rounded-none text-xs font-bold text-white ${activeView === 'parts' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} focus:outline-none focus:ring-1 focus:ring-black transition-colors uppercase tracking-wider`}
          >
            PARTS
          </Link>
          <Link
            to="/printers"
            onClick={() => onViewChange('printers')}
            className={`w-auto px-4 py-2 border border-black rounded-none text-xs font-bold text-white ${activeView === 'printers' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} focus:outline-none focus:ring-1 focus:ring-black transition-colors uppercase tracking-wider`}
          >
            PRINTERS
          </Link>
          <Link
            to="/products"
            onClick={() => onViewChange('products')}
            className={`w-auto px-4 py-2 border border-black rounded-none text-xs font-bold text-white ${activeView === 'products' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} focus:outline-none focus:ring-1 focus:ring-black transition-colors uppercase tracking-wider`}
          >
            PRODUCTS
          </Link>
          <Link
            to="/settings"
            onClick={() => onViewChange('settings')}
            className={`w-auto px-4 py-2 border border-black rounded-none text-xs font-bold text-white ${activeView === 'settings' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} focus:outline-none focus:ring-1 focus:ring-black transition-colors uppercase tracking-wider`}
          >
            SETTINGS
          </Link>
        </div>
      </div>
      <div className="w-1/4 flex justify-end">
        <div className="flex space-x-2">
          {activeView !== 'printers' && activeView !== 'settings' && (
            <button
              onClick={onAddClick}
              className="w-full sm:w-auto px-4 py-2 border border-black rounded-none text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-1 focus:ring-black transition-colors uppercase tracking-wider"
            >
              NEW {activeView === 'parts' ? 'PART' : activeView === 'products' ? 'PRODUCT' : 'RECORD'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;