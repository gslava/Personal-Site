import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import {
  buildHomeHref,
  buildLocaleHref,
  resolveCurrentLocale,
} from '../locale/locale-bootstrap.util';
import { SiteLocaleCode, SiteLocaleOption } from '../models/site-locale';
import { LocalePersistenceService } from './locale-persistence.service';

const LOCALES: readonly SiteLocaleOption[] = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'uk', label: 'UK' },
] as const;

@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly localePersistence = inject(LocalePersistenceService);

  readonly locales = LOCALES;
  readonly currentLocale = (): SiteLocaleCode => {
    return resolveCurrentLocale({
      pathname: this.document.defaultView?.location.pathname ?? '/',
      lang: this.document.documentElement.lang,
    });
  };

  readonly localeLinks = () =>
    this.locales.map((locale) => ({
      ...locale,
      href: this.buildLocaleHref(locale.code),
      isActive: locale.code === this.currentLocale(),
    }));
  readonly homeHref = () => this.buildHomeHref(this.currentLocale());

  constructor() {
    this.localePersistence.persistLocale(this.currentLocale());
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.localePersistence.persistLocale(this.currentLocale());
    });
  }

  buildLocaleHref(targetLocale: SiteLocaleCode): string {
    const location = this.document.defaultView?.location;

    if (!location) {
      return targetLocale === 'en' ? '/' : `/${targetLocale}/`;
    }

    return buildLocaleHref({
      pathname: location.pathname,
      hash: this.getCurrentHash(),
      targetLocale,
    });
  }

  buildHomeHref(targetLocale: SiteLocaleCode): string {
    const location = this.document.defaultView?.location;

    if (!location) {
      return targetLocale === 'en' ? '/' : `/${targetLocale}/`;
    }

    return buildHomeHref(location.pathname, targetLocale);
  }

  persistLocale(locale: SiteLocaleCode): void {
    this.localePersistence.persistLocale(locale);
  }

  private getCurrentHash(): string {
    return this.document.defaultView?.location.hash || '';
  }
}
