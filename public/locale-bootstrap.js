// Generated from src/app/core/locale/locale-contract.json. Do not edit manually.
(() => {
  const defaultLocale = "en";
  const locales = ["en","de","uk"];
  const pathLocalizedLocales = ["de","uk"];
  const localeCookieName = "site_locale";
  const localeMaxAge = 31536000;
  const pathname = window.location.pathname || '/';
  const search = window.location.search || '';
  const hash = window.location.hash || '';

  const isLocaleCode = (value) => locales.includes(value);
  const isPathLocalizedLocale = (value) => pathLocalizedLocales.includes(value);
  const getPathSegments = (value) => value.split('/').filter(Boolean);
  const getExplicitLocaleFromPath = (value) => {
    const localeSegment = getPathSegments(value).at(-1);
    return isLocaleCode(localeSegment) ? localeSegment : null;
  };
  const stripTrailingLocaleSegment = (segments) => {
    const normalizedSegments = [...segments];
    const trailingLocale = normalizedSegments.at(-1);

    if (isLocaleCode(trailingLocale)) {
      normalizedSegments.pop();
    }

    return normalizedSegments;
  };
  const buildPathWithLocale = (value, locale) => {
    const segments = stripTrailingLocaleSegment(getPathSegments(value));

    if (isPathLocalizedLocale(locale)) {
      segments.push(locale);
    }

    return segments.length > 0 ? `/${segments.join('/')}/` : '/';
  };
  const readLocaleCookie = () => {
    const rawCookies = document.cookie ? document.cookie.split(';') : [];

    for (const rawCookie of rawCookies) {
      const [name, value] = rawCookie.trim().split('=');

      if (name === localeCookieName && isLocaleCode(value)) {
        return value;
      }
    }

    return null;
  };
  const writeLocaleCookie = (locale) => {
    document.cookie = `${localeCookieName}=${locale}; Max-Age=${localeMaxAge}; Path=/; SameSite=Lax`;
  };

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-locale-link]') : null;

      if (!target) {
        return;
      }

      const locale = target.getAttribute('data-locale-code');

      if (isLocaleCode(locale)) {
        writeLocaleCookie(locale);
      }
    },
    { capture: true },
  );

  const explicitLocale = getExplicitLocaleFromPath(pathname);

  if (explicitLocale) {
    writeLocaleCookie(explicitLocale);
    return;
  }

  const preferredLocale = readLocaleCookie();

  if (isPathLocalizedLocale(preferredLocale)) {
    window.location.replace(`${buildPathWithLocale(pathname, preferredLocale)}${search}${hash || ''}`);
    return;
  }

  writeLocaleCookie(defaultLocale);
})();
