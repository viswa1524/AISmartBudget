import { CURRENCIES } from '../data/initialData';

export function formatCurrency(amount: number, currencyCode: string = 'USD'): string {
  const currency = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const converted = amount * (currency.rate || 1.0);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted);
}

export function formatDate(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function calculateCategoryTotals(transactions: Array<{ amount: number; type: string; category: string }>): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const tx of transactions) {
    if (tx.type === 'expense') {
      totals[tx.category] = (totals[tx.category] || 0) + tx.amount;
    }
  }
  return totals;
}
