export declare const CURRENCY_SYMBOLS: Record<string, string>;
export declare const FX_BASE_RATES: Record<string, number>;
export declare function formatCurrency(amount: number, currencyCode?: string): string;
export declare function convertCurrency(amount: number, fromCurrency?: string, toCurrency?: string): number;
export declare function calculatePercentage(part: number, total: number): number;
