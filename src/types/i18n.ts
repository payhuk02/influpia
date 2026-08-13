// ============================================================
// i18n & Multi-Currency Types
// ============================================================

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  symbol_position: 'before' | 'after';
  decimal_places: number;
  thousands_separator: string;
  decimal_separator: string;
  exchange_rate_to_base: number;
  is_active: boolean;
  is_base: boolean;
  supported_by_payment_providers: string[];
  created_at: string;
  updated_at: string;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
  is_default: boolean;
  rtl: boolean;
  flag_emoji?: string;
  created_at: string;
}

export interface Translation {
  id: string;
  language_code: string;
  key: string;
  value: string;
  context?: string;
  pluralization?: Record<string, string>;
  is_verified: boolean;
  translated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  user_id: string;
  preferred_language_code?: string;
  preferred_currency_code?: string;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
  first_day_of_week: number;
  email_notifications: boolean;
  push_notifications: boolean;
  marketing_emails: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExchangeRateHistory {
  id: string;
  from_currency_code: string;
  to_currency_code: string;
  rate: number;
  rate_date: string;
  source: 'manual' | 'api' | 'scheduled';
  created_at: string;
}

export interface RegionalSettings {
  id: string;
  country_code: string;
  country_name: string;
  default_currency_code?: string;
  default_language_code?: string;
  default_timezone?: string;
  date_format: string;
  tax_rate: number;
  vat_enabled: boolean;
  payment_methods: string[];
  created_at: string;
}

export interface CurrencyFormatOptions {
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface TranslationNamespace {
  [key: string]: string | TranslationNamespace;
}
