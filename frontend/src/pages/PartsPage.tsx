import React from 'react';
import PartList from '../components/PartList';
import { Part } from '../types/part';
import { Printer } from '../types/printer';

interface PartsPageProps {
    parts: Part[];
    printers: Printer[];
    onUpdatePart: (part: Part) => void;
    onDeletePart: (id: number) => void;
}

/**
 * Page component for the Parts view
 */
const PartsPage: React.FC<PartsPageProps> = ({
    parts,
    printers,
    onUpdatePart,
    onDeletePart
}) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
                <PartList
                    parts={parts}
                    printers={printers.filter(p => p.id !== undefined) as any}
                    onUpdatePart={onUpdatePart}
                    onDeletePart={onDeletePart}
                />
            </div>
        </div>
    );
};

export default PartsPage;