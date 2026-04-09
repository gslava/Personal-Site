import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  PLATFORM_ID,
  ViewChild,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LocaleService } from '../../services/locale.service';
import { SiteLocaleCode } from '../../models/site-locale';

const SCROLL_TOP_LABELS: Record<SiteLocaleCode, string> = {
  en: 'Scroll to top',
  de: 'Nach oben scrollen',
  uk: 'Прокрутити вгору',
};

const LOCALE_SWITCHER_LABELS: Record<SiteLocaleCode, string> = {
  en: 'Language switcher',
  de: 'Sprachauswahl',
  uk: 'Перемикач мови',
};

@Component({
  selector: 'app-site-shell',
  imports: [RouterOutlet],
  templateUrl: './site-shell.component.html',
  styleUrl: './site-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteShellComponent implements AfterViewInit {
  @ViewChild('siteHeader', { static: true }) private readonly siteHeaderRef!: ElementRef<HTMLElement>;

  protected readonly localeService = inject(LocaleService);

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const header = this.siteHeaderRef.nativeElement;
    const rootStyle = this.document.documentElement.style;
    const windowRef = this.document.defaultView;
    const updateHeaderHeight = (): void => {
      rootStyle.setProperty('--site-header-height', `${Math.round(header.getBoundingClientRect().height)}px`);
    };

    updateHeaderHeight();

    if (!windowRef || typeof ResizeObserver === 'undefined') {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      const resizeObserver = new ResizeObserver(() => updateHeaderHeight());
      resizeObserver.observe(header);

      this.destroyRef.onDestroy(() => resizeObserver.disconnect());
    });
  }

  protected localeSwitcherLabel(): string {
    return LOCALE_SWITCHER_LABELS[this.localeService.currentLocale()];
  }

  protected scrollTopLabel(): string {
    return SCROLL_TOP_LABELS[this.localeService.currentLocale()];
  }

  protected scrollToTop(): void {
    const windowRef = this.document.defaultView;

    if (!windowRef) {
      return;
    }

    windowRef.history.replaceState(null, '', this.localeService.homeHref());
    windowRef.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
