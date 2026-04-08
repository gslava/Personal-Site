import {
  buildHomeHref,
  buildLocaleCookie,
  buildLocaleHref,
  getExplicitLocaleFromPath,
  readLocaleCookie,
  resolveCurrentLocale,
  resolveLocaleBootstrapInstruction,
} from './locale-bootstrap.util';

describe('locale bootstrap utilities', () => {
  it('detects explicit locale from the trailing path segment', () => {
    expect(getExplicitLocaleFromPath('/')).toBeNull();
    expect(getExplicitLocaleFromPath('/de/')).toBe('de');
    expect(getExplicitLocaleFromPath('/uk/')).toBe('uk');
    expect(getExplicitLocaleFromPath('/personal-site/de/')).toBe('de');
    expect(getExplicitLocaleFromPath('/personal-site/')).toBeNull();
  });

  it('reads the locale cookie when present', () => {
    expect(readLocaleCookie('theme=dark; site_locale=uk')).toBe('uk');
    expect(readLocaleCookie('site_locale=de')).toBe('de');
    expect(readLocaleCookie('')).toBeNull();
  });

  it('builds a cookie header fragment for the locale', () => {
    expect(buildLocaleCookie('en')).toContain('site_locale=en');
    expect(buildLocaleCookie('en')).toContain('Path=/');
  });

  it('builds locale and home hrefs from the shared path helpers', () => {
    expect(
      buildLocaleHref({
        pathname: '/personal-site/de/',
        hash: '#/projects',
        targetLocale: 'en',
      }),
    ).toBe('/personal-site/#/projects');
    expect(
      buildLocaleHref({
        pathname: '/personal-site/de/',
        hash: '#/projects',
        targetLocale: 'uk',
      }),
    ).toBe('/personal-site/uk/#/projects');
    expect(buildHomeHref('/personal-site/uk/', 'en')).toBe('/personal-site/#/');
    expect(buildHomeHref('/personal-site/', 'de')).toBe('/personal-site/de/#/');
  });

  it('resolves the current locale from path first and document language second', () => {
    expect(resolveCurrentLocale({ pathname: '/uk/', lang: 'en' })).toBe('uk');
    expect(resolveCurrentLocale({ pathname: '/', lang: 'de-DE' })).toBe('de');
    expect(resolveCurrentLocale({ pathname: '/', lang: undefined })).toBe('en');
  });

  it('redirects root requests to the preferred localized path from cookie', () => {
    expect(
      resolveLocaleBootstrapInstruction({
        pathname: '/',
        search: '',
        hash: '#/projects',
        cookieString: 'site_locale=de',
      }),
    ).toEqual({
      explicitLocale: null,
      persistLocale: 'de',
      redirectUrl: '/de/#/projects',
    });
  });

  it('preserves repository paths when redirecting from cookie', () => {
    expect(
      resolveLocaleBootstrapInstruction({
        pathname: '/personal-site/',
        search: '',
        hash: '#/contact',
        cookieString: 'site_locale=uk',
      }),
    ).toEqual({
      explicitLocale: null,
      persistLocale: 'uk',
      redirectUrl: '/personal-site/uk/#/contact',
    });
  });

  it('does not redirect when the URL already has an explicit locale', () => {
    expect(
      resolveLocaleBootstrapInstruction({
        pathname: '/de/',
        search: '',
        hash: '#/about-me',
        cookieString: 'site_locale=en',
      }),
    ).toEqual({
      explicitLocale: 'de',
      persistLocale: 'de',
      redirectUrl: null,
    });
  });
});
