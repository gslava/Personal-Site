import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { LocaleService } from '../../../core/services/locale.service';
import { MarkdownContentService } from '../../../core/content/markdown-content.service';
import { MarkdownPageContent, MarkdownPageKey } from '../../../core/content/markdown-content.models';

@Component({
  selector: 'app-markdown-page',
  templateUrl: './markdown-page.component.html',
  styleUrl: './markdown-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarkdownPageComponent {
  private readonly localeService = inject(LocaleService);
  private readonly markdownContentService = inject(MarkdownContentService);

  readonly pageKey = input<MarkdownPageKey>('technologies');
  private readonly contentRequest = computed(() => ({
    locale: this.localeService.currentLocale(),
    pageKey: this.pageKey(),
  }));

  readonly content = toSignal(
    toObservable(this.contentRequest).pipe(
      switchMap(({ locale, pageKey }) => this.markdownContentService.loadPage(locale, pageKey)),
    ),
    {
      initialValue: {
        html: '',
        locale: this.localeService.currentLocale(),
        pageKey: this.pageKey(),
        usedFallback: false,
      } as MarkdownPageContent,
    },
  );
}
