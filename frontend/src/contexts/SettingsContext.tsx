import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Settings, fetchSettings, updateSettings } from '../services/api';

// Default settings (fallback values)
const defaultSettings: Settings = {
    spool_weight: 1000,
    filament_markup: 20,
    hourly_rate: 20,
    wear_tear_markup: 5,
    platform_fees: 7,
    filament_spool_price: 18,
    desired_profit_margin: 55,
    packaging_cost: 0.5
};

interface SettingsContextType {
    settings: Settings;
    isLoading: boolean;
    error: string | null;
    updateSettings: (newSettings: Settings) => Promise<Settings>;
    refreshSettings: () => Promise<void>;
}

// Create the context with a default value
const SettingsContext = createContext<SettingsContextType>({
    settings: defaultSettings,
    isLoading: false,
    error: null,
    updateSettings: async () => defaultSettings,
    refreshSettings: async () => { }
});

// Custom hook for consuming the context
export const useSettings = () => useContext(SettingsContext);

interface SettingsProviderProps {
    children: ReactNode;
}

// Provider component that wraps your app and makes settings available to any child component
export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Load settings on mount
    useEffect(() => {
        refreshSettings();
    }, []);

    // Function to refresh settings from the API
    const refreshSettings = async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const loadedSettings = await fetchSettings();
            setSettings(loadedSettings);
        } catch (err) {
            setError('Failed to load settings');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to update settings
    const handleUpdateSettings = async (newSettings: Settings): Promise<Settings> => {
        setIsLoading(true);
        setError(null);

        try {
            const updatedSettings = await updateSettings(newSettings);
            setSettings(updatedSettings);
            return updatedSettings;
        } catch (err) {
            setError('Failed to update settings');
            console.error(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Value provided to consumers of the context
    const value: SettingsContextType = {
        settings,
        isLoading,
        error,
        updateSettings: handleUpdateSettings,
        refreshSettings
    };

    return (
        <SettingsContext.Provider value= { value } >
        { children }
        </SettingsContext.Provider>
  );
};

export default SettingsContext;