import React from 'react';
import Settings from '../components/Settings';
import { useSettings } from '../contexts/AppContext';

/**
 * Page component for the Settings view
 * Uses the SettingsContext to access and update settings
 */
const SettingsPage: React.FC = () => {
  // Get settings and updateSettings function from context
  const { settings, updateSettings, isLoading, error } = useSettings();

  return (
    <div className="border-2 border-black">
      {isLoading ? (
        <div className="p-4 text-center">Loading settings...</div>
      ) : (
        <Settings 
          settings={settings} 
          onUpdateSettings={updateSettings} 
        />
      )}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4">
          {error}
        </div>
      )}
    </div>
  );
};

export default SettingsPage;