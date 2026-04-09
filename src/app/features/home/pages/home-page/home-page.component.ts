import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  NgZone,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ParticleSphereComponent } from '../../components/particle-sphere/particle-sphere.component';
import { SinglePageContentService } from '../../../../core/content/single-page-content.service';
import { SinglePageSection } from '../../../../core/content/single-page-content.models';
import { LocaleService } from '../../../../core/services/locale.service';
import { SiteLocaleCode } from '../../../../core/models/site-locale';

type HomePageCopy = {
  readonly contentAriaLabel: string;
};

const HOME_PAGE_COPY: Record<SiteLocaleCode, HomePageCopy> = {
  en: {
    contentAriaLabel: 'Page sections',
  },
  de: {
    contentAriaLabel: 'Seitenabschnitte',
  },
  uk: {
    contentAriaLabel: 'Розділи сторінки',
  },
};

@Component({
  selector: 'app-home-page',
  imports: [ParticleSphereComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent {
  private readonly contentService = inject(SinglePageContentService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly localeService = inject(LocaleService);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private lastHandledHash = '';
  private pendingHashScrollTimerId: number | null = null;

  protected readonly pageContent = signal({
    locale: this.localeService.currentLocale(),
    sections: [] as readonly SinglePageSection[],
    usedFallback: true,
  });
  protected readonly sections = computed(() => this.pageContent().sections);
  protected readonly copy = computed(() => HOME_PAGE_COPY[this.pageContent().locale]);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const windowRef = this.document.defaultView;
    const handleHistoryNavigation = (): void => {
      this.lastHandledHash = '';
      this.scheduleInitialHashScroll();
    };

    windowRef?.addEventListener('popstate', handleHistoryNavigation);
    this.destroyRef.onDestroy(() => {
      windowRef?.removeEventListener('popstate', handleHistoryNavigation);

      if (windowRef && this.pendingHashScrollTimerId !== null) {
        windowRef.clearTimeout(this.pendingHashScrollTimerId);
      }
    });

    this.contentService
      .loadPage(this.localeService.currentLocale())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((content) => {
        this.pageContent.set(content);
        this.lastHandledHash = '';
        this.scheduleInitialHashScroll();
      });
  }

  protected sectionHref(id: string): string {
    return `#${id}`;
  }

  protected trackSection(_index: number, section: SinglePageSection): string {
    return section.id;
  }

  private scheduleInitialHashScroll(): void {
    const windowRef = this.document.defaultView;
    const hash = windowRef?.location.hash.slice(1) ?? '';

    if (!windowRef || !hash || hash === this.lastHandledHash) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      if (this.pendingHashScrollTimerId !== null) {
        windowRef.clearTimeout(this.pendingHashScrollTimerId);
      }

      this.pendingHashScrollTimerId = windowRef.setTimeout(() => {
        this.attemptHashScroll(hash, 12);
        this.pendingHashScrollTimerId = null;
      }, 80);
    });
  }

  private scrollToElement(id: string, behavior: ScrollBehavior): void {
    const windowRef = this.document.defaultView;
    const target = this.document.getElementById(id);

    if (!windowRef || !target) {
      return;
    }

    const headerHeight = this.resolveHeaderOffset();
    const nextTop = Math.max(0, target.getBoundingClientRect().top + windowRef.scrollY - headerHeight - 16);

    this.lastHandledHash = id;
    windowRef.scrollTo({
      top: nextTop,
      behavior,
    });
  }

  private attemptHashScroll(id: string, attemptsLeft: number): void {
    const windowRef = this.document.defaultView;
    const target = this.document.getElementById(id);

    if (!windowRef) {
      return;
    }

    if (target) {
      this.scrollToElement(id, 'auto');

      if (this.isElementAligned(target) || attemptsLeft <= 1) {
        return;
      }
    } else if (attemptsLeft <= 1) {
      return;
    }

    this.pendingHashScrollTimerId = windowRef.setTimeout(() => {
      this.attemptHashScroll(id, attemptsLeft - 1);
    }, 140);
  }

  private isElementAligned(target: HTMLElement): boolean {
    const headerHeight = this.resolveHeaderOffset();
    const topDelta = Math.abs(target.getBoundingClientRect().top - (headerHeight + 16));

    return topDelta < 24;
  }

  private resolveHeaderOffset(): number {
    const windowRef = this.document.defaultView;

    if (!windowRef) {
      return 0;
    }

    const rootStyles = windowRef.getComputedStyle(this.document.documentElement);
    const headerHeight = Number.parseFloat(rootStyles.getPropertyValue('--site-header-height'));

    return Number.isFinite(headerHeight) ? headerHeight : 92;
  }
}
