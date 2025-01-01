export interface Filament {
    id?: number;
    name: string;
    material: string;
    color: string;
    diameter: number;
    quantity: number;
    manufacturer?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export type FilamentFormData = Omit<Filament, 'id' | 'created_at' | 'updated_at'>;

export const MATERIAL_TYPES = [
    'PLA',
    'PETG',
    'ABS',
    'TPU',
    'Nylon',
    'PC',
    'ASA',
    'PVA',
    'HIPS',
    'Other'
] as const;

export const COMMON_DIAMETERS = [1.75, 2.85, 3.00] as const; 