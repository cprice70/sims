import React from 'react';

interface CompanySettingsSectionProps {
  companyName1: string;
  companyName2: string;
  isEditing: boolean;
  decodeHtmlEntities: (text: string | undefined) => string;
  onChange: (key: 'company_name_1' | 'company_name_2', value: string) => void;
}

const CompanySettingsSection: React.FC<CompanySettingsSectionProps> = ({
  companyName1,
  companyName2,
  isEditing,
  decodeHtmlEntities,
  onChange,
}) => (
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
          value={decodeHtmlEntities(companyName1)}
          onChange={(e) => onChange('company_name_1', e.target.value)}
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
          value={decodeHtmlEntities(companyName2)}
          onChange={(e) => onChange('company_name_2', e.target.value)}
          disabled={!isEditing}
          className="w-full p-2 border border-black bg-white text-black disabled:bg-gray-100"
        />
        <p className="mt-1 text-xs text-gray-500">
          Default: "Cedar & Sail"
        </p>
      </div>
    </div>
  </div>
);

export default CompanySettingsSection;
