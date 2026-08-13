// ============================================================
// i18n Configuration
// ============================================================

export const languages = [
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷', isDefault: true },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', isDefault: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', isDefault: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', isDefault: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', isDefault: false, rtl: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', isDefault: false },
];

export const currencies = [
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', symbolPosition: 'after', decimalPlaces: 0, isBase: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', symbolPosition: 'before', decimalPlaces: 2, isBase: false },
  { code: 'EUR', name: 'Euro', symbol: '€', symbolPosition: 'after', decimalPlaces: 2, isBase: false },
  { code: 'GBP', name: 'British Pound', symbol: '£', symbolPosition: 'before', decimalPlaces: 2, isBase: false },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', symbolPosition: 'before', decimalPlaces: 2, isBase: false },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', symbolPosition: 'before', decimalPlaces: 2, isBase: false },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', symbolPosition: 'before', decimalPlaces: 2, isBase: false },
];

export const timezones = [
  'Africa/Abidjan',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Europe/Paris',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
  'Asia/Dubai',
];

export const dateFormats = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

export const timeFormats = [
  { value: '12h', label: '12h (AM/PM)' },
  { value: '24h', label: '24h' },
];

export const firstDaysOfWeek = [
  { value: 0, label: 'Dimanche' },
  { value: 1, label: 'Lundi' },
];

// Default settings
export const defaultSettings = {
  language: 'fr',
  currency: 'XOF',
  timezone: 'Africa/Abidjan',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  firstDayOfWeek: 1,
};

// Format currency
export function formatCurrency(
  amount: number,
  currency: string = 'XOF',
  locale: string = 'fr-FR'
): string {
  const currencyConfig = currencies.find(c => c.code === currency) || currencies[0];
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currencyConfig.decimalPlaces,
    maximumFractionDigits: currencyConfig.decimalPlaces,
  }).format(amount);
}

// Format number with locale
export function formatNumber(
  value: number,
  locale: string = 'fr-FR',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

// Format date
export function formatDate(
  date: Date | string,
  format: string = 'DD/MM/YYYY',
  locale: string = 'fr-FR'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (format === 'DD/MM/YYYY') {
    return d.toLocaleDateString(locale);
  } else if (format === 'MM/DD/YYYY') {
    return d.toLocaleDateString('en-US');
  } else {
    return d.toISOString().split('T')[0];
  }
}

// Format date with time
export function formatDateTime(
  date: Date | string,
  locale: string = 'fr-FR',
  timeFormat: '12h' | '24h' = '24h'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (timeFormat === '12h') {
    return d.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  
  return d.toLocaleString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

// Get language direction
export function getLanguageDirection(languageCode: string): 'ltr' | 'rtl' {
  const lang = languages.find(l => l.code === languageCode);
  return lang?.rtl ? 'rtl' : 'ltr';
}

// Get language flag emoji
export function getLanguageFlag(languageCode: string): string {
  const lang = languages.find(l => l.code === languageCode);
  return lang?.flag || '🌐';
}
