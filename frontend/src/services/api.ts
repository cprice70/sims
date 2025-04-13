import { Filament } from '../types/filament';
import { PrintQueueItem, Printer } from '../types/printer';
import { PurchaseListItem } from '../types/purchase';
import { Part } from '../types/part';
import { Product, ProductFormData } from '../types/product';
import { API_URL } from '../config';

// Filaments API
export const fetchFilaments = async (): Promise<Filament[]> => {
    const response = await fetch(`${API_URL}/api/filaments`);
    if (!response.ok) throw new Error('Failed to fetch filaments');
    return response.json();
};

export const addFilament = async (filament: Filament): Promise<Filament> => {
    const response = await fetch(`${API_URL}/api/filaments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filament)
    });
    if (!response.ok) throw new Error('Failed to add filament');
    return response.json();
};

export const updateFilament = async (filament: Filament): Promise<Filament> => {
    const response = await fetch(`${API_URL}/api/filaments/${filament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filament)
    });
    if (!response.ok) throw new Error('Failed to update filament');
    return response.json();
};

export const deleteFilament = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/filaments/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete filament');
};

// Printers API
export const fetchPrinters = async (): Promise<Printer[]> => {
    const response = await fetch(`${API_URL}/api/printers`);
    if (!response.ok) throw new Error('Failed to fetch printers');
    return response.json();
};

// Print Queue API
export const fetchPrintQueue = async (): Promise<PrintQueueItem[]> => {
    const response = await fetch(`${API_URL}/api/print-queue`);
    if (!response.ok) throw new Error('Failed to fetch print queue');
    return response.json();
};

export const addQueueItem = async (item: PrintQueueItem): Promise<PrintQueueItem> => {
    const response = await fetch(`${API_URL}/api/print-queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to add queue item');
    return response.json();
};

export const updateQueueItem = async (item: PrintQueueItem): Promise<PrintQueueItem> => {
    const response = await fetch(`${API_URL}/api/print-queue/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to update queue item');
    return response.json();
};

export const deleteQueueItem = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/print-queue/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete queue item');
};

export const reorderQueueItems = async (items: PrintQueueItem[]): Promise<PrintQueueItem[]> => {
    const response = await fetch(`${API_URL}/api/print-queue/reorder`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items })
    });

    if (!response.ok) throw new Error('Failed to reorder queue items');
    return response.json();
};

// Purchase List API
export const fetchPurchaseItems = async (): Promise<PurchaseListItem[]> => {
    const response = await fetch(`${API_URL}/api/purchase-list`);
    if (!response.ok) throw new Error('Failed to fetch purchase items');
    return response.json();
};

export const addPurchaseItem = async (item: PurchaseListItem): Promise<PurchaseListItem> => {
    const response = await fetch(`${API_URL}/api/purchase-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to add purchase item');
    return response.json();
};

export const updatePurchaseItem = async (item: PurchaseListItem): Promise<PurchaseListItem> => {
    const response = await fetch(`${API_URL}/api/purchase-list/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to update purchase item');
    return response.json();
};

export const deletePurchaseItem = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/purchase-list/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete purchase item');
};

// Parts API
export const fetchParts = async (): Promise<Part[]> => {
    const response = await fetch(`${API_URL}/api/parts`);
    if (!response.ok) throw new Error('Failed to fetch parts');
    return response.json();
};

export const addPart = async (part: Part): Promise<Part> => {
    const response = await fetch(`${API_URL}/api/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(part)
    });
    if (!response.ok) throw new Error('Failed to add part');
    return response.json();
};

export const updatePart = async (part: Part): Promise<Part> => {
    const response = await fetch(`${API_URL}/api/parts/${part.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(part)
    });
    if (!response.ok) throw new Error('Failed to update part');
    return response.json();
};

export const deletePart = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/parts/${id}`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete part');
};

// Products API
export const fetchProducts = async (): Promise<Product[]> => {
    const response = await fetch(`${API_URL}/api/products`);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
};

export const addProduct = async (product: Product | ProductFormData): Promise<Product> => {
    // Extract filaments from the product data
    const filaments = 'filaments' in product ? product.filaments || [] : [];

    // Create the product without filaments first
    const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: product.name,
            business: product.business,
            filament_used: product.filament_used,
            print_prep_time: product.print_prep_time,
            post_processing_time: product.post_processing_time,
            additional_parts_cost: product.additional_parts_cost,
            list_price: product.list_price,
            notes: product.notes || ''
        })
    });

    if (!response.ok) throw new Error('Failed to add product');

    // Get the newly created product ID
    const newProduct = await response.json();

    // Associate filaments if any were selected
    if (filaments.length > 0 && newProduct.id) {
        for (const filament of filaments) {
            if (filament.id) {
                // First add the filament association
                await fetch(`${API_URL}/api/products/${newProduct.id}/filaments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ filament_id: filament.id })
                });

                // Then update the usage amount if specified
                if (filament.filament_usage_amount !== undefined) {
                    await fetch(`${API_URL}/api/products/${newProduct.id}/filaments/${filament.id}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ filament_usage_amount: filament.filament_usage_amount })
                    });
                }
            }
        }
    }

    // Add filaments to the new product object
    return {
        ...newProduct,
        filaments: filaments
    };
};

export const updateProduct = async (product: Product | ProductFormData, productId?: number): Promise<Product> => {
    const id = 'id' in product ? product.id : productId;
    if (!id) throw new Error('Product ID is required');

    const productWithId = {
        ...product,
        id,
        filament_used: product.filament_used || 0, // Ensure filament_used is always defined
        notes: product.notes || '' // Ensure notes is always defined
    };

    const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(productWithId),
    });

    if (!response.ok) {
        throw new Error('Failed to update product');
    }

    return response.json();
};

export const deleteProduct = async (id: number): Promise<void> => {
    const response = await fetch(`${API_URL}/api/products/${id}`, {
        method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete product');
};

// Settings API
export interface Settings {
    spool_weight: number;
    filament_markup: number;
    hourly_rate: number;
    wear_tear_markup: number;
    platform_fees: number;
    filament_spool_price: number;
    desired_profit_margin: number;
    packaging_cost: number;
    [key: string]: number;
}

export const fetchSettings = async (): Promise<Settings> => {
    const response = await fetch(`${API_URL}/api/settings?t=${Date.now()}`);
    if (!response.ok) throw new Error('Failed to fetch settings');

    const data = await response.json();

    // Convert string values to numbers
    return Object.entries(data).reduce((acc, [key, value]) => {
        acc[key] = parseFloat(value as string) || 0;
        return acc;
    }, {} as Settings);
};

export const updateSettings = async (settings: Settings): Promise<Settings> => {
    // Convert numbers to strings for API, preserving zero values
    const stringSettings = Object.entries(settings).reduce((acc, [key, value]) => {
        acc[key] = value === 0 ? '0' : value.toString();
        return acc;
    }, {} as Record<string, string>);

    const response = await fetch(`${API_URL}/api/settings`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(stringSettings)
    });

    if (!response.ok) throw new Error('Failed to update settings');

    const data = await response.json();

    // Convert string values back to numbers, preserving zero values
    return Object.entries(data).reduce((acc, [key, value]) => {
        const numValue = parseFloat(value as string);
        acc[key] = isNaN(numValue) ? 0 : numValue;
        return acc;
    }, {} as Settings);
};