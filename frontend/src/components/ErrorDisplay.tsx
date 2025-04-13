import React from 'react';

interface ErrorDisplayProps {
  error: string;
  onClose?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onClose }) => {
  return (
    <div className="p-4 border-2 border-black bg-white text-black">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider mb-1">SIMS ERROR</div>
          <div className="text-sm">{error}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-black hover:text-gray-700"
            aria-label="Close error message"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorDisplay;