import { useState, useEffect } from 'react';

import { Settings as SettingsType } from '../services/api';
import CompanySettingsSection from './CompanySettingsSection';
import GeneralSettingsSection from './GeneralSettingsSection';
import CostSettingsSection from './CostSettingsSection';
import MarkupFeesSection from './MarkupFeesSection';

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
        <CompanySettingsSection
  companyName1={formSettings.company_name_1 ?? ''}
  companyName2={formSettings.company_name_2 ?? ''}
  isEditing={isEditing}
  decodeHtmlEntities={decodeHtmlEntities}
  onChange={handleChange}
/>
        
        <GeneralSettingsSection
  spoolWeight={typeof formSettings.spool_weight === 'number' ? formSettings.spool_weight : Number(formSettings.spool_weight) || 0}
  hourlyRate={typeof formSettings.hourly_rate === 'number' ? formSettings.hourly_rate : Number(formSettings.hourly_rate) || 0}
  isEditing={isEditing}
  onChange={handleChange}
/>
        
        <CostSettingsSection
  filamentSpoolPrice={typeof formSettings.filament_spool_price === 'number' ? formSettings.filament_spool_price : Number(formSettings.filament_spool_price) || 0}
  globalSpoolPrice={typeof formSettings.global_spool_price === 'number' ? formSettings.global_spool_price : (formSettings.global_spool_price !== undefined ? Number(formSettings.global_spool_price) : undefined)}
  packagingCost={typeof formSettings.packaging_cost === 'number' ? formSettings.packaging_cost : Number(formSettings.packaging_cost) || 0}
  isEditing={isEditing}
  onChange={handleChange}
/>
        
        <MarkupFeesSection
          filamentMarkup={typeof formSettings.filament_markup === 'number' ? formSettings.filament_markup : Number(formSettings.filament_markup) || 0}
          wearTearMarkup={typeof formSettings.wear_tear_markup === 'number' ? formSettings.wear_tear_markup : Number(formSettings.wear_tear_markup) || 0}
          wearTearPercentage={typeof formSettings.wear_tear_percentage === 'number' ? formSettings.wear_tear_percentage : (formSettings.wear_tear_percentage !== undefined ? Number(formSettings.wear_tear_percentage) : (typeof formSettings.wear_tear_markup === 'number' ? formSettings.wear_tear_markup / 100 : 0))}
          desiredMarkup={typeof formSettings.desired_markup === 'number' ? formSettings.desired_markup : Number(formSettings.desired_markup) || 0}
          defaultMarkup={typeof formSettings.default_markup === 'number' ? formSettings.default_markup : Number(formSettings.default_markup) || 0}
          desiredProfitMargin={typeof formSettings.desired_profit_margin === 'number' ? formSettings.desired_profit_margin : Number(formSettings.desired_profit_margin) || 0}
          platformFees={typeof formSettings.platform_fees === 'number' ? formSettings.platform_fees : Number(formSettings.platform_fees) || 0}
          platformFeePercentage={typeof formSettings.platform_fee_percentage === 'number' ? formSettings.platform_fee_percentage : (formSettings.platform_fee_percentage !== undefined ? Number(formSettings.platform_fee_percentage) : (typeof formSettings.platform_fees === 'number' ? formSettings.platform_fees / 100 : 0))}
          isEditing={isEditing}
          onChange={handleChange}
        />
        
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
