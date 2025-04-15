import React from 'react';

interface GeneralSettingsSectionProps {
  spoolWeight: number;
  hourlyRate: number;
  isEditing: boolean;
  onChange: (key: 'spool_weight' | 'hourly_rate', value: string) => void;
}

const GeneralSettingsSection: React.FC<GeneralSettingsSectionProps> = ({
  spoolWeight,
  hourlyRate,
  isEditing,
  onChange,
}) => (
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
          value={spoolWeight}
          onChange={(e) => onChange('spool_weight', e.target.value)}
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
          value={hourlyRate}
          onChange={(e) => onChange('hourly_rate', e.target.value)}
          disabled={!isEditing}
          className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
        />
      </div>
    </div>
  </div>
);

export default GeneralSettingsSection;
