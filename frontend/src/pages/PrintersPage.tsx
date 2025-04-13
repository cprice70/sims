import React from 'react';
import PrinterList from '../components/PrinterList';
import { Printer } from '../types/printer';

interface PrintersPageProps {
  printers: Printer[];
  onUpdate: () => void;
  onDelete: () => void;
  onAdd: () => void;
}

/**
 * Page component for the Printers view
 */
const PrintersPage: React.FC<PrintersPageProps> = ({
  printers,
  onUpdate,
  onDelete,
  onAdd
}) => {
  return (
    <div className= "grid grid-cols-1 lg:grid-cols-4 gap-4" >
    <div className="lg:col-span-3" >
      <PrinterList
          printers={ printers }
  onUpdate = { onUpdate }
  onDelete = { onDelete }
  onAdd = { onAdd }
    />
    </div>
    </div>
  );
};

export default PrintersPage;