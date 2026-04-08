import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LocaleService } from './locale.service';

describe('LocaleService', () => {
  function setLocation(pathname: string, hash = '#/projects'): void {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        ...window.location,
        pathname,
        hash,
      },
    });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  it('builds locale links for a root deployment', () => {
    setLocation('/', '#/projects');
    document.documentElement.lang = 'en';
    const service = TestBed.inject(LocaleService);

    expect(service.buildLocaleHref('en')).toBe('/#/projects');
    expect(service.buildLocaleHref('de')).toBe('/de/#/projects');
    expect(service.buildLocaleHref('uk')).toBe('/uk/#/projects');
  });

  it('preserves a repository path for GitHub Pages deployments', () => {
    setLocation('/personal-site/', '#/contact');
    document.documentElement.lang = 'en';
    const service = TestBed.inject(LocaleService);

    expect(service.buildLocaleHref('en')).toBe('/personal-site/#/contact');
    expect(service.buildLocaleHref('de')).toBe('/personal-site/de/#/contact');
    expect(service.buildLocaleHref('uk')).toBe('/personal-site/uk/#/contact');
  });

  it('derives the current locale from the current path without getting stuck', () => {
    setLocation('/uk/', '#/');
    document.documentElement.lang = 'uk';
    const service = TestBed.inject(LocaleService);

    expect(service.currentLocale()).toBe('uk');

    setLocation('/', '#/');
    document.documentElement.lang = 'en';

    expect(service.currentLocale()).toBe('en');

    setLocation('/de/', '#/');
    document.documentElement.lang = 'de';

    expect(service.currentLocale()).toBe('de');
  });
});
