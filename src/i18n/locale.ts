export const locales = ["pl", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pl";
export const localeCookieName = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && locales.includes(value as Locale);
}

type LanguagePreference = {
  range: string;
  quality: number;
  order: number;
};

function parseAcceptLanguage(value: string | null | undefined) {
  if (!value) return [];

  const preferences: LanguagePreference[] = [];

  for (const [order, part] of value.split(",").entries()) {
    const [rawRange, ...parameters] = part.trim().split(";");
    const range = rawRange?.trim().toLowerCase();
    if (!range) continue;

    let quality = 1;
    let hasQuality = false;
    let valid = true;

    for (const parameter of parameters) {
      const [rawName, rawValue, ...extra] = parameter.split("=");
      const name = rawName?.trim().toLowerCase();
      const parameterValue = rawValue?.trim();

      if (name !== "q" || hasQuality || extra.length > 0 || !parameterValue) {
        valid = false;
        break;
      }

      if (!/^(?:0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/.test(parameterValue)) {
        valid = false;
        break;
      }

      quality = Number(parameterValue);
      hasQuality = true;
    }

    if (!valid) continue;

    if (range !== "*") {
      try {
        Intl.getCanonicalLocales(range);
      } catch {
        continue;
      }
    }

    preferences.push({ range, quality, order });
  }

  return preferences.sort(
    (first, second) =>
      second.quality - first.quality || first.order - second.order,
  );
}

function localeForRange(range: string): Locale | undefined {
  if (range === "*") return undefined;

  const language = range.split("-")[0];
  return isLocale(language) ? language : undefined;
}

export function resolveLocale({
  explicitLocale,
  cookie,
  acceptLanguage,
}: {
  explicitLocale?: string | null;
  cookie?: string | null;
  acceptLanguage?: string | null;
}): Locale {
  if (isLocale(explicitLocale)) return explicitLocale;
  if (isLocale(cookie)) return cookie;

  const preferences = parseAcceptLanguage(acceptLanguage);
  const excluded = new Set(
    preferences
      .filter(({ quality }) => quality === 0)
      .map(({ range }) => localeForRange(range))
      .filter((locale): locale is Locale => locale !== undefined),
  );

  for (const { range, quality } of preferences) {
    if (quality === 0) continue;

    if (range === "*") {
      const available = locales.find((locale) => !excluded.has(locale));
      if (available) return available;
      continue;
    }

    const locale = localeForRange(range);
    if (locale && !excluded.has(locale)) return locale;
  }

  return defaultLocale;
}
