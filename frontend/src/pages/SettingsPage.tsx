import React from 'react';
import Settings from '../components/Settings';
import { Settings as SettingsType } from '../services/api';

interface SettingsPageProps {
  settings: SettingsType;
  onUpdateSettings: (settings: SettingsType) => Promise<SettingsType>;
}

/**
 * Page component for the Settings view
 */
const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings
}) => {
  return (
    <div className="border-2 border-black">
      <Settings 
        settings={settings} 
        onUpdateSettings={onUpdateSettings} 
      />
    </div>
  );
};

export default SettingsPage;