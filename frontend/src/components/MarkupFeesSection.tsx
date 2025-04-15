import React from 'react';

interface MarkupFeesSectionProps {
  filamentMarkup: number;
  wearTearMarkup: number;
  wearTearPercentage: number;
  desiredMarkup: number;
  defaultMarkup: number;
  platformFees: number;
  platformFeePercentage: number | undefined;
  desiredProfitMargin: number;
  isEditing: boolean;
  onChange: (
    key:
      | 'filament_markup'
      | 'wear_tear_markup'
      | 'wear_tear_percentage'
      | 'desired_markup'
      | 'default_markup'
      | 'platform_fees'
      | 'platform_fee_percentage'
      | 'desired_profit_margin',
    value: string
  ) => void;
}

const MarkupFeesSection: React.FC<MarkupFeesSectionProps> = ({
  filamentMarkup,
  wearTearMarkup,
  wearTearPercentage,
  desiredMarkup,
  defaultMarkup,
  platformFees,
  platformFeePercentage,
  desiredProfitMargin,
  isEditing,
  onChange,
}) => (
  <div className="border-2 border-black">
    <div className="bg-black text-white p-2 text-xs font-medium uppercase tracking-wider">
      Markup & Fees
    </div>
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Filament Markup (%)
        </label>
        <input
          type="number"
          step="1"
          min="0"
          value={filamentMarkup}
          onChange={(e) => onChange('filament_markup', e.target.value)}
          disabled={!isEditing}
          className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Wear & Tear Markup (%)
        </label>
        <input
          type="number"
          step="1"
          min="0"
          value={wearTearMarkup}
          onChange={(e) => onChange('wear_tear_markup', e.target.value)}
          disabled={!isEditing}
          className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Wear & Tear Percentage (0-1)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={wearTearPercentage}
          onChange={(e) => onChange('wear_tear_percentage', e.target.value)}
          disabled={!isEditing}
          className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Desired Markup (%)
        </label>
        <input
          type="number"
          step="1"
          min="0"
          value={desiredMarkup}
          onChange={(e) => onChange('desired_markup', e.target.value)}
          disabled={!isEditing}
          className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Default Markup (0-1)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={defaultMarkup}
          onChange={(e) => onChange('default_markup', e.target.value)}
          disabled={!isEditing}
          className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Platform Fees (%)
        </label>
        <input
          type="number"
          step="1"
          min="0"
          value={platformFees}
          onChange={(e) => onChange('platform_fees', e.target.value)}
          disabled={!isEditing}
          className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Platform Fee Percentage (0-1)
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          max="1"
          value={platformFeePercentage}
          onChange={(e) => onChange('platform_fee_percentage', e.target.value)}
          disabled={!isEditing}
          className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-black mb-1">
          Desired Profit Margin (%)
        </label>
        <input
          type="number"
          step="1"
          min="0"
          value={desiredProfitMargin}
          onChange={(e) => onChange('desired_profit_margin', e.target.value)}
          disabled={!isEditing}
          className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
        />
      </div>
    </div>
  </div>
);

export default MarkupFeesSection;
