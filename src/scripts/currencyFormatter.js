/**
 * AISmartBudget - Pure JavaScript Currency & Numerical Formatter
 * Language: JavaScript (ES6+)
 */

export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CAD: 'C$',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
  SGD: 'S$'
};

export const FX_BASE_RATES = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.45,
  JPY: 155.20,
  CAD: 1.36,
  AUD: 1.51,
  CHF: 0.91,
  CNY: 7.24,
  SGD: 1.35
};

/**
 * Formats a raw number into a localized currency string
 * @param {number} amount 
 * @param {string} currencyCode 
 * @returns {string}
 */
export function formatCurrency(amount, currencyCode = 'USD') {
  const sym = CURRENCY_SYMBOLS[currencyCode] || '$';
  const val = Number(amount) || 0;
  return `${sym}${val.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Converts an amount from one currency to another
 * @param {number} amount 
 * @param {string} fromCurrency 
 * @param {string} toCurrency 
 * @returns {number}
 */
export function convertCurrency(amount, fromCurrency = 'USD', toCurrency = 'USD') {
  const num = Number(amount) || 0;
  if (fromCurrency === toCurrency) return num;
  
  const fromRate = FX_BASE_RATES[fromCurrency] || 1.0;
  const toRate = FX_BASE_RATES[toCurrency] || 1.0;
  
  // Convert from origin to USD, then from USD to target
  const inUSD = num / fromRate;
  const inTarget = inUSD * toRate;
  return Math.round(inTarget * 100) / 100;
}

/**
 * Calculates percentage share of total
 * @param {number} part 
 * @param {number} total 
 * @returns {number}
 */
export function calculatePercentage(part, total) {
  const p = Number(part) || 0;
  const t = Number(total) || 0;
  if (t === 0) return 0;
  return Math.round((p / t) * 1000) / 10;
}
