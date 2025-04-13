import { Product, ProductWithCalculations } from '../types/product';
import { Settings } from '../services/api';

/**
 * Calculate profit margins and other financial metrics for a product
 */
export const calculateProductMargins = (
    product: Product,
    settings: Settings
): ProductWithCalculations => {
    // Calculate labor cost
    const totalMinutes = product.print_prep_time + product.post_processing_time;
    const laborCost = (totalMinutes / 60) * settings.hourly_rate;

    // Calculate total filament used and cost from individual filament amounts and costs
    let totalFilamentUsed = 0;
    let totalFilamentCost = 0;

    if (product.filaments && product.filaments.length > 0) {
        product.filaments.forEach(filament => {
            const amount = filament.filament_usage_amount || 0;
            // Use individual filament cost if set, otherwise fall back to global price
            const cost = filament.cost || settings.filament_spool_price;
            totalFilamentUsed += amount;
            totalFilamentCost += (amount / 1000) * cost; // Convert grams to kg for cost calculation
        });
    } else {
        // Fallback to using the global filament price if no filaments are set
        totalFilamentUsed = product.filament_used;
        totalFilamentCost = (product.filament_used / 1000) * settings.filament_spool_price;
    }

    // Calculate wear and tear cost
    const wearTearCost = totalFilamentCost * (settings.wear_tear_markup / 100);

    // Calculate total cost (now including additional parts cost and packaging cost)
    const totalCost = laborCost + totalFilamentCost + wearTearCost +
        product.additional_parts_cost + settings.packaging_cost;

    // Calculate suggested price based on desired profit margin
    const platformFeePercent = settings.platform_fees / 100;
    const desiredMarginDecimal = settings.desired_profit_margin / 100;
    const suggestedPrice = totalCost / (1 - desiredMarginDecimal - platformFeePercent);

    // Use list_price if set, otherwise use suggested price based on profit margin
    const sellingPrice = product.list_price > 0
        ? product.list_price
        : suggestedPrice;

    // Calculate platform fees
    const platformFeeAmount = sellingPrice * (settings.platform_fees / 100);

    // Calculate gross profit
    const grossProfit = sellingPrice - totalCost - platformFeeAmount;

    // Calculate profit margin
    const profitMargin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;

    return {
        ...product,
        filament_used: totalFilamentUsed,
        labor_cost: laborCost,
        filament_cost: totalFilamentCost,
        wear_tear_cost: wearTearCost,
        total_cost: totalCost,
        selling_price: sellingPrice,
        platform_fee_amount: platformFeeAmount,
        gross_profit: grossProfit,
        profit_margin: profitMargin,
        suggested_price: suggestedPrice
    };
};

/**
 * Calculate profit margins for a collection of products
 */
export const calculateProductsMargins = (
    products: Product[],
    settings: Settings
): ProductWithCalculations[] => {
    return products.map(product => calculateProductMargins(product, settings));
};