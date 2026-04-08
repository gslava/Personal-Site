import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { SiteLocaleCode } from '../models/site-locale';
import { buildLocaleCookie, readLocaleCookie } from '../locale/locale-bootstrap.util';

@Injectable({ providedIn: 'root' })
export class LocalePersistenceService {
  private readonly document = inject(DOCUMENT);

  persistLocale(locale: SiteLocaleCode): void {
    const currentCookie = this.readLocale();

    if (currentCookie === locale) {
      return;
    }

    this.document.cookie = buildLocaleCookie(locale);
  }

  readLocale(): SiteLocaleCode | null {
    return readLocaleCookie(this.document.cookie);
  }
}
