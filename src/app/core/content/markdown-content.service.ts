import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { marked } from 'marked';
import { catchError, map, Observable, of } from 'rxjs';
import { SiteLocaleCode } from '../models/site-locale';
import { getContentPageLabel } from './content-registry';
import { MarkdownPageContent, MarkdownPageKey } from './markdown-content.models';

marked.setOptions({
  gfm: true,
  breaks: false,
});

@Injectable({ providedIn: 'root' })
export class MarkdownContentService {
  private readonly http = inject(HttpClient);

  loadPage(locale: SiteLocaleCode, pageKey: MarkdownPageKey): Observable<MarkdownPageContent> {
    return this.loadMarkdownForLocale(locale, pageKey).pipe(
      catchError(() => {
        if (locale === 'en') {
          return of(this.buildFallbackContent(locale, pageKey, true));
        }

        return this.loadMarkdownForLocale('en', pageKey).pipe(
          catchError(() => of(this.buildFallbackContent(locale, pageKey, true))),
          map((content) => ({
            ...content,
            locale,
            usedFallback: true,
          })),
        );
      }),
    );
  }

  private loadMarkdownForLocale(
    locale: SiteLocaleCode,
    pageKey: MarkdownPageKey,
  ): Observable<MarkdownPageContent> {
    return this.http
      .get(this.buildAssetPath(locale, pageKey), {
        responseType: 'text',
      })
      .pipe(
        map((markdown) => ({
          html: this.renderMarkdown(markdown),
          locale,
          pageKey,
          usedFallback: false,
        })),
      );
  }

  private renderMarkdown(markdown: string): string {
    const rendered = marked.parse(markdown);

    return typeof rendered === 'string' ? rendered : '';
  }

  private buildAssetPath(locale: SiteLocaleCode, pageKey: MarkdownPageKey): string {
    return `assets/content/${locale}/${pageKey}.md`;
  }

  private buildFallbackContent(
    locale: SiteLocaleCode,
    pageKey: MarkdownPageKey,
    usedFallback: boolean,
  ): MarkdownPageContent {
    return {
      html: this.renderMarkdown(this.getFallbackMarkdown(locale, pageKey)),
      locale,
      pageKey,
      usedFallback,
    };
  }

  private getFallbackMarkdown(locale: SiteLocaleCode, pageKey: MarkdownPageKey): string {
    const sectionTitle = getContentPageLabel(pageKey, locale);

    switch (locale) {
      case 'de':
        return `# ${sectionTitle}\n\nDer Inhalt für diesen Bereich wird gerade vorbereitet.`;
      case 'uk':
        return `# ${sectionTitle}\n\nКонтент для цього розділу зараз готується.`;
      default:
        return `# ${sectionTitle}\n\nContent for this section is being prepared.`;
    }
  }
}
