// Currency utilities and configuration

export const CURRENCIES = {
  // Major Currencies
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', countries: 'United States' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', countries: 'Eurozone' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', countries: 'United Kingdom' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', countries: 'Japan' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', countries: 'Canada' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', countries: 'Australia' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', countries: 'Switzerland' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', countries: 'China' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', countries: 'India' },
  MXN: { code: 'MXN', symbol: '$', name: 'Mexican Peso', countries: 'Mexico' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', countries: 'Singapore' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', countries: 'Hong Kong' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', countries: 'New Zealand' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', countries: 'South Korea' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', countries: 'Sweden' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', countries: 'Norway' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone', countries: 'Denmark' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', countries: 'South Africa' },
  BRL: { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', countries: 'Brazil' },
  RUB: { code: 'RUB', symbol: '₽', name: 'Russian Ruble', countries: 'Russia' },
  TRY: { code: 'TRY', symbol: '₺', name: 'Turkish Lira', countries: 'Turkey' },
  AED: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', countries: 'United Arab Emirates' },
  SAR: { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', countries: 'Saudi Arabia' },
  QAR: { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', countries: 'Qatar' },
  PKR: { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', countries: 'Pakistan' },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', countries: 'Indonesia' },
  THB: { code: 'THB', symbol: '฿', name: 'Thai Baht', countries: 'Thailand' },
  MYR: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', countries: 'Malaysia' },
  PHP: { code: 'PHP', symbol: '₱', name: 'Philippine Peso', countries: 'Philippines' },
  VND: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', countries: 'Vietnam' },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES[code as CurrencyCode];
  return currency?.symbol || code;
}

export function getCurrencyName(code: string): string {
  const currency = CURRENCIES[code as CurrencyCode];
  return currency?.name || code;
}

export function formatCurrencyWithCode(amount: number, currencyCode: string): string {
  const currency = CURRENCIES[currencyCode as CurrencyCode];
  
  if (!currency) {
    // Fallback to basic formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  }

  // Format with locale
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getAllCurrencies() {
  return Object.entries(CURRENCIES).map(([code, data]) => ({
    ...data,
    code: code as CurrencyCode,
  }));
}

export function getCurrencyByCode(code: string) {
  return CURRENCIES[code as CurrencyCode];
}
