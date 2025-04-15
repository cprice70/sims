import React from 'react';

interface CostSettingsSectionProps {
  filamentSpoolPrice: number;
  globalSpoolPrice: number | undefined;
  packagingCost: number;
  isEditing: boolean;
  onChange: (key: 'filament_spool_price' | 'global_spool_price' | 'packaging_cost', value: string) => void;
}

const CostSettingsSection: React.FC<CostSettingsSectionProps> = ({
  filamentSpoolPrice,
  globalSpoolPrice,
  packagingCost,
  isEditing,
  onChange,
}) => (
  <div className="border-2 border-black">
    <div className="bg-black text-white p-2 text-xs font-medium uppercase tracking-wider">
      Cost Settings
    </div>
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Filament Spool Price ($)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={filamentSpoolPrice}
          onChange={(e) => onChange('filament_spool_price', e.target.value)}
          disabled={!isEditing}
          className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Global Spool Price ($)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={globalSpoolPrice ?? filamentSpoolPrice}
          onChange={(e) => onChange('global_spool_price', e.target.value)}
          disabled={!isEditing}
          className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Packaging Cost ($)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={packagingCost}
          onChange={(e) => onChange('packaging_cost', e.target.value)}
          disabled={!isEditing}
          className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
        />
      </div>
    </div>
  </div>
);

export default CostSettingsSection;
