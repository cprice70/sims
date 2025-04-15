import { useState, useEffect } from 'react';

import { Settings as SettingsType } from '../services/api';

interface SettingsProps {
  settings: SettingsType;
  onUpdateSettings: (newSettings: SettingsType) => Promise<SettingsType>;
}

// Utility function to decode HTML entities
const decodeHtmlEntities = (text: string | undefined): string => {
  if (!text) return '';
  // Create a temporary textarea element to leverage the browser's decoding
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

const Settings = ({ settings, onUpdateSettings }: SettingsProps) => {
  const [formSettings, setFormSettings] = useState(settings);
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    setFormSettings(settings);
  }, [settings]);

  const handleChange = (key: string, value: string) => {
    // For company name fields, store as string
    if (key === 'company_name_1' || key === 'company_name_2') {
      setFormSettings({
        ...formSettings,
        [key]: value
      });
    } else {
      // For numeric fields, parse as number
      const numValue = parseFloat(value);
      if (!isNaN(numValue) || value === '') {
        setFormSettings({
          ...formSettings,
          [key]: value === '' ? 0 : numValue
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    
    try {
      // Prepare settings object
      const updatedSettings: SettingsType = {
        ...formSettings,
        // Ensure company names are strings and trim whitespace
        company_name_1: (formSettings.company_name_1?.toString() || '').trim(),
        company_name_2: (formSettings.company_name_2?.toString() || '').trim(),
        // Ensure numeric fields are numbers
        spool_weight: Number(formSettings.spool_weight),
        filament_markup: Number(formSettings.filament_markup),
        hourly_rate: Number(formSettings.hourly_rate),
        wear_tear_markup: Number(formSettings.wear_tear_markup),
        platform_fees: Number(formSettings.platform_fees),
        filament_spool_price: Number(formSettings.filament_spool_price),
        desired_profit_margin: Number(formSettings.desired_profit_margin),
        packaging_cost: Number(formSettings.packaging_cost)
      };

      await onUpdateSettings(updatedSettings);
      setSaveStatus('success');
      setIsEditing(false);
      
      // Reset save status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setSaveStatus('error');
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold uppercase tracking-wider">SYSTEM SETTINGS</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white border border-black text-xs font-bold uppercase tracking-wider"
          >
            EDIT SETTINGS
          </button>
        ) : null}
      </div>
      
      {saveStatus === 'success' && (
        <div className="bg-green-100 border border-green-500 text-green-700 p-2 mb-4">
          Settings saved successfully!
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="bg-red-100 border border-red-500 text-red-700 p-2 mb-4">
          Error saving settings. Please try again.
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        <div className="border-2 border-black">
          <div className="bg-black text-white p-2 text-xs font-medium uppercase tracking-wider">
            Company Settings
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Company Name 1
              </label>
              <input
                type="text"
                value={decodeHtmlEntities(formSettings.company_name_1)}
                onChange={(e) => handleChange('company_name_1', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Default: "Super Fantastic"
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Company Name 2
              </label>
              <input
                type="text"
                value={decodeHtmlEntities(formSettings.company_name_2)}
                onChange={(e) => handleChange('company_name_2', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500">
                Default: "Cedar & Sail"
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-2 border-black">
          <div className="bg-black text-white p-2 text-xs font-medium uppercase tracking-wider">
            General Settings
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Spool Weight (g)
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={formSettings.spool_weight}
                onChange={(e) => handleChange('spool_weight', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Hourly Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formSettings.hourly_rate}
                onChange={(e) => handleChange('hourly_rate', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
        
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
                value={formSettings.filament_spool_price}
                onChange={(e) => handleChange('filament_spool_price', e.target.value)}
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
                value={formSettings.global_spool_price ?? formSettings.filament_spool_price}
                onChange={(e) => handleChange('global_spool_price', e.target.value)}
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
                value={formSettings.packaging_cost}
                onChange={(e) => handleChange('packaging_cost', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
        
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
                value={formSettings.filament_markup}
                onChange={(e) => handleChange('filament_markup', e.target.value)}
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
                value={formSettings.wear_tear_markup}
                onChange={(e) => handleChange('wear_tear_markup', e.target.value)}
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
                value={formSettings.wear_tear_percentage ?? (formSettings.wear_tear_markup / 100)}
                onChange={(e) => handleChange('wear_tear_percentage', e.target.value)}
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
                value={formSettings.desired_markup ?? (typeof formSettings.desired_profit_margin === 'number' ? formSettings.desired_profit_margin * 2 : 0)}
                onChange={(e) => handleChange('desired_markup', e.target.value)}
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
                value={formSettings.default_markup ?? (typeof formSettings.desired_markup === 'number' ? formSettings.desired_markup / 100 : 0)}
                onChange={(e) => handleChange('default_markup', e.target.value)}
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
                value={formSettings.desired_profit_margin}
                onChange={(e) => handleChange('desired_profit_margin', e.target.value)}
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
                value={formSettings.platform_fees}
                onChange={(e) => handleChange('platform_fees', e.target.value)}
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
                value={formSettings.platform_fee_percentage ?? (formSettings.platform_fees / 100)}
                onChange={(e) => handleChange('platform_fee_percentage', e.target.value)}
                disabled={!isEditing}
                className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
              />
            </div>
          </div>
        </div>
        
        {isEditing && (
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => {
                setFormSettings(settings);
                setIsEditing(false);
              }}
              className="px-4 py-2 bg-gray-600 text-white border border-black text-xs font-bold uppercase tracking-wider"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="px-4 py-2 bg-green-600 text-white border border-black text-xs font-bold uppercase tracking-wider"
            >
              {saveStatus === 'saving' ? 'SAVING...' : 'SAVE SETTINGS'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default Settings;
