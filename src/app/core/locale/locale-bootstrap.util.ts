import localeContract from './locale-contract.json';
import { SiteLocaleCode } from '../models/site-locale';

type PathLocalizedSiteLocaleCode = Exclude<SiteLocaleCode, 'en'>;

const localeCodes = localeContract.locales as readonly SiteLocaleCode[];
const pathLocalizedLocaleCodes = localeContract.pathLocalizedLocales as readonly PathLocalizedSiteLocaleCode[];

export const SITE_LOCALE_CODES = localeCodes;
export const DEFAULT_SITE_LOCALE = localeContract.defaultLocale as SiteLocaleCode;
export const PATH_LOCALIZED_SITE_LOCALE_CODES = pathLocalizedLocaleCodes;
export const LOCALE_COOKIE_NAME = localeContract.cookieName;
export const LOCALE_COOKIE_MAX_AGE = localeContract.cookieMaxAge;

export interface LocaleBootstrapInstruction {
  readonly explicitLocale: SiteLocaleCode | null;
  readonly persistLocale: SiteLocaleCode;
  readonly redirectUrl: string | null;
}

export function isSiteLocaleCode(value: string | undefined): value is SiteLocaleCode {
  return value === 'en' || value === 'de' || value === 'uk';
}

export function getExplicitLocaleFromPath(pathname: string): SiteLocaleCode | null {
  const segments = getPathSegments(pathname);
  const localeSegment = segments.at(-1);

  return isSiteLocaleCode(localeSegment) ? localeSegment : null;
}

export function resolveDocumentLocale(lang: string | null | undefined): SiteLocaleCode {
  const normalized = (lang || DEFAULT_SITE_LOCALE).toLowerCase();
  return normalized.startsWith('de') ? 'de' : normalized.startsWith('uk') ? 'uk' : DEFAULT_SITE_LOCALE;
}

export function resolveCurrentLocale(input: {
  pathname: string;
  lang: string | null | undefined;
}): SiteLocaleCode {
  return getExplicitLocaleFromPath(input.pathname) ?? resolveDocumentLocale(input.lang);
}

export function readLocaleCookie(cookieString: string): SiteLocaleCode | null {
  const cookies = cookieString ? cookieString.split(';') : [];

  for (const rawCookie of cookies) {
    const [name, value] = rawCookie.trim().split('=');

    if (name === LOCALE_COOKIE_NAME && isSiteLocaleCode(value)) {
      return value;
    }
  }

  return null;
}

export function buildLocaleCookie(locale: SiteLocaleCode): string {
  return `${LOCALE_COOKIE_NAME}=${locale}; Max-Age=${LOCALE_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
}

export function buildLocaleHref(input: {
  pathname: string;
  hash: string;
  targetLocale: SiteLocaleCode;
}): string {
  const path = buildPathWithLocale(input.pathname, input.targetLocale);
  return `${path}${normalizeHash(input.hash)}`;
}

export function buildHomeHref(pathname: string, targetLocale: SiteLocaleCode): string {
  return `${buildPathWithLocale(pathname, targetLocale)}#/`;
}

export function resolveLocaleBootstrapInstruction(input: {
  pathname: string;
  search: string;
  hash: string;
  cookieString: string;
}): LocaleBootstrapInstruction {
  const explicitLocale = getExplicitLocaleFromPath(input.pathname);

  if (explicitLocale) {
    return {
      explicitLocale,
      persistLocale: explicitLocale,
      redirectUrl: null,
    };
  }

  const preferredLocale = readLocaleCookie(input.cookieString);

  if (preferredLocale && isPathLocalizedLocaleCode(preferredLocale)) {
    const redirectUrl = `${buildPathWithLocale(input.pathname, preferredLocale)}${input.search}${normalizeHash(input.hash)}`;

    return {
      explicitLocale: null,
      persistLocale: preferredLocale,
      redirectUrl,
    };
  }

  return {
    explicitLocale: null,
    persistLocale: DEFAULT_SITE_LOCALE,
    redirectUrl: null,
  };
}

export function buildPathWithLocale(pathname: string, locale: SiteLocaleCode): string {
  const segments = stripTrailingLocaleSegment(getPathSegments(pathname));

  if (isPathLocalizedLocaleCode(locale)) {
    segments.push(locale);
  }

  return segments.length > 0 ? `/${segments.join('/')}/` : '/';
}

export function getPathSegments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean);
}

export function stripTrailingLocaleSegment(segments: readonly string[]): string[] {
  const normalizedSegments = [...segments];
  const trailingLocale = normalizedSegments.at(-1);

  if (isSiteLocaleCode(trailingLocale)) {
    normalizedSegments.pop();
  }

  return normalizedSegments;
}

export function isPathLocalizedLocaleCode(value: SiteLocaleCode | null | undefined): value is PathLocalizedSiteLocaleCode {
  return value === 'de' || value === 'uk';
}

function normalizeHash(hash: string): string {
  return hash || '#/';
}
