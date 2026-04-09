import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { SiteLocaleCode } from '../models/site-locale';
import { buildFallbackSinglePageContent, parseSinglePageMarkdown } from './single-page-content.parser';
import { SinglePageContent } from './single-page-content.models';

@Injectable({ providedIn: 'root' })
export class SinglePageContentService {
  private readonly http = inject(HttpClient);

  loadPage(locale: SiteLocaleCode): Observable<SinglePageContent> {
    return this.loadMarkdownForLocale(locale).pipe(
      catchError(() => {
        if (locale === 'en') {
          return of(buildFallbackSinglePageContent(locale));
        }

        return this.loadMarkdownForLocale('en').pipe(
          catchError(() => of(buildFallbackSinglePageContent(locale))),
          map((content) => ({
            ...content,
            locale,
            usedFallback: true,
          })),
        );
      }),
    );
  }

  buildInitialContent(locale: SiteLocaleCode): SinglePageContent {
    return buildFallbackSinglePageContent(locale);
  }

  private loadMarkdownForLocale(locale: SiteLocaleCode): Observable<SinglePageContent> {
    return this.http
      .get(`assets/content/${locale}/all-in-one-page.md`, {
        responseType: 'text',
      })
      .pipe(
        map((markdown) => ({
          locale,
          sections: parseSinglePageMarkdown(markdown, locale),
          usedFallback: false,
        })),
      );
  }
}
