import * as countryCurrency from 'country-currency-map';

/**
 * Maps Profile / Register dropdown country labels → keys used by `country-currency-map`
 * when they differ.
 */
const COUNTRY_NAME_ALIASES = {
  Iran: 'Iran (Islamic Republic Of)',
  'North Korea': "Korea, Democratic People's Republic Of",
  'South Korea': 'Korea, Republic Of',
  Syria: 'Syrian Arab Republic',
  Tanzania: 'Tanzania, United Republic Of',
  'Trinidad and Tobago': 'Trinidad And Tobago',
  Vietnam: 'Viet Nam',
  'Vatican City': 'Vatican City State (Holy See)',
  'North Macedonia': 'Macedonia, The Former Yugoslav Republic Of',
  Moldova: 'Moldova, Republic Of',
  Croatia: 'Croatia (local name: Hrvatska)',
  Micronesia: 'Micronesia, Federated States Of',
  Palestine: 'Palestinian Territories',
};

/** When the dataset’s currency is wrong or not what users expect for that profile country. */
const CURRENCY_OVERRIDE_BY_COUNTRY = {
  'South Korea': 'KRW',
  'North Korea': 'KPW',
  Vietnam: 'VND',
  Turkey: 'TRY',
  Ukraine: 'UAH',
  Romania: 'RON',
  Peru: 'PEN',
  Uruguay: 'UYU',
  'Costa Rica': 'CRC',
  Moldova: 'MDL',
};

const LOCALE_HINTS = {
  USD: 'en-US',
  INR: 'en-IN',
  GBP: 'en-GB',
  EUR: 'en-IE',
  AUD: 'en-AU',
  CAD: 'en-CA',
  JPY: 'ja-JP',
  CNY: 'zh-CN',
  KRW: 'ko-KR',
  PKR: 'en-PK',
  BDT: 'bn-BD',
  AED: 'ar-AE',
  SAR: 'ar-SA',
  TRY: 'tr-TR',
  BRL: 'pt-BR',
  MXN: 'es-MX',
  ZAR: 'en-ZA',
  NGN: 'en-NG',
  EGP: 'ar-EG',
  THB: 'th-TH',
  IDR: 'id-ID',
  MYR: 'ms-MY',
  PHP: 'en-PH',
  VND: 'vi-VN',
  TWD: 'zh-TW',
  CHF: 'de-CH',
  SEK: 'sv-SE',
  NOK: 'nb-NO',
  DKK: 'da-DK',
  PLN: 'pl-PL',
  HUF: 'hu-HU',
  CZK: 'cs-CZ',
  ILS: 'he-IL',
  NZD: 'en-NZ',
  SGD: 'en-SG',
  HKD: 'zh-HK',
  KWD: 'ar-KW',
  QAR: 'ar-QA',
  LKR: 'si-LK',
  NPR: 'ne-NP',
};

function normalizeCountryKey(country) {
  if (country == null) return '';
  return String(country).trim();
}

function resolveLookupName(country) {
  const raw = normalizeCountryKey(country);
  if (!raw) return '';
  if (COUNTRY_NAME_ALIASES[raw]) return COUNTRY_NAME_ALIASES[raw];
  const lower = raw.toLowerCase();
  const aliasKey = Object.keys(COUNTRY_NAME_ALIASES).find((k) => k.toLowerCase() === lower);
  if (aliasKey) return COUNTRY_NAME_ALIASES[aliasKey];
  return raw;
}

/**
 * @returns {{ code: string, locale: string }}
 */
function findOverrideCode(raw) {
  if (!raw) return null;
  if (CURRENCY_OVERRIDE_BY_COUNTRY[raw]) return CURRENCY_OVERRIDE_BY_COUNTRY[raw];
  const key = Object.keys(CURRENCY_OVERRIDE_BY_COUNTRY).find((k) => k.toLowerCase() === raw.toLowerCase());
  return key ? CURRENCY_OVERRIDE_BY_COUNTRY[key] : null;
}

export function getWalletCurrencyMeta(country) {
  const raw = normalizeCountryKey(country);
  const overrideCode = findOverrideCode(raw);
  if (overrideCode) {
    return {
      code: overrideCode,
      locale: LOCALE_HINTS[overrideCode] || 'en-US',
    };
  }

  const lookup = resolveLookupName(country);
  const fromPkg = lookup ? countryCurrency.getCurrencyAbbreviation(lookup) : undefined;
  const code = typeof fromPkg === 'string' && fromPkg.length === 3 ? fromPkg : 'USD';
  return {
    code,
    locale: LOCALE_HINTS[code] || 'en-US',
  };
}

export function formatWalletAmount(amount, country, options = {}) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  const { code, locale } = getWalletCurrencyMeta(country);
  const fraction =
    code === 'JPY' || code === 'KRW' || code === 'VND' || code === 'CLP' || code === 'PYG' || code === 'ISK'
      ? { minimumFractionDigits: 0, maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 };
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      ...fraction,
      ...options,
    }).format(n);
  } catch {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', ...fraction }).format(n);
  }
}

export function walletCurrencyCode(country) {
  return getWalletCurrencyMeta(country).code;
}

/** Credit / debit line like "+₹100.00" or "-$10.00" using the user’s country currency. */
export function formatSignedWalletDelta(amount, type, country) {
  const n = Math.abs(Number(amount));
  const body = formatWalletAmount(n, country);
  if (type === 'credit') return `+${body}`;
  return `-${body}`;
}
