import { DOCUMENT, ViewportScroller } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  ViewChild,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { LocaleService } from '../../services/locale.service';
import { PortfolioContentService } from '../../content/portfolio-content';
import { PageMetadataService } from '../../services/page-metadata.service';

@Component({
  selector: 'app-site-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './site-shell.component.html',
  styleUrls: ['./site-shell.component.scss', './mobile-menu.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiteShellComponent {
  @ViewChild('menuButton') private menuButton?: ElementRef<HTMLButtonElement>;
  protected readonly localeService = inject(LocaleService);
  protected readonly t = inject(PortfolioContentService).text;
  protected readonly navigation = [
    { path: 'work', label: this.t.nav[0] },
    { path: 'about', label: this.t.nav[2] },
    { path: 'contact', label: this.t.nav[4] },
  ];
  protected readonly menuOpen = signal(false);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly metadata = inject(PageMetadataService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('mobileMenu') private mobileMenu?: ElementRef<HTMLDialogElement>;
  private closeTimer?: ReturnType<typeof setTimeout>;
  private restoreScroll?: () => void;
  constructor() {
    inject(ViewportScroller).setOffset(() => [
      0,
      (this.document.querySelector('.site-header')?.getBoundingClientRect().height ?? 80) + 24,
    ]);
    afterNextRender(() => {
      const window = this.document.defaultView;
      if (!window?.matchMedia) return;
      const desktop = window.matchMedia('(min-width: 961px)');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      const onResize = () => {
        if (!desktop.matches || !this.mobileMenu?.nativeElement.open) return;
        this.closeMenu(false, true);
        this.document
          .querySelector<HTMLAnchorElement>('#primary-navigation a')
          ?.focus({ preventScroll: true });
      };
      const onMotionChange = () => {
        if (reducedMotion.matches && !this.menuOpen()) this.closeMenu(true, true);
      };
      desktop.addEventListener('change', onResize);
      reducedMotion.addEventListener('change', onMotionChange);
      this.destroyRef.onDestroy(() => {
        desktop.removeEventListener('change', onResize);
        reducedMotion.removeEventListener('change', onMotionChange);
      });
    });
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.closeTimer);
      if (this.mobileMenu?.nativeElement.open) this.mobileMenu.nativeElement.close();
      this.unlockScroll();
    });
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.closeMenu(false, true);
        const legacyAnchor = /^\/#(education|about-me|technologies)$/.exec(this.router.url);
        if (legacyAnchor) {
          void this.router.navigate(['/about'], { fragment: legacyAnchor[1], replaceUrl: true });
          return;
        }
        this.metadata.update(this.router.url);
        // Focus the destination after navigation, without disturbing history scroll restoration.
        requestAnimationFrame(() => {
          const main = this.document.getElementById('main-content');
          main?.focus({ preventScroll: true });
        });
      });
  }
  protected closeMenu(restoreFocus = true, immediate = false): void {
    const dialog = this.mobileMenu?.nativeElement;
    if (!dialog?.open) return;
    clearTimeout(this.closeTimer);
    this.menuOpen.set(false);
    const finish = () => {
      dialog.close();
      this.unlockScroll();
      if (restoreFocus) this.menuButton?.nativeElement.focus({ preventScroll: true });
    };
    if (
      immediate ||
      this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      finish();
    } else {
      this.closeTimer = setTimeout(finish, 240);
    }
  }

  protected onMenuCancel(event: Event): void {
    event.preventDefault();
    this.closeMenu();
  }

  protected onDialogClosed(): void {
    // A queued close event may arrive after a rapid reopen.
    if (this.mobileMenu?.nativeElement.open) return;
    clearTimeout(this.closeTimer);
    this.menuOpen.set(false);
    this.unlockScroll();
  }

  protected toggleMenu(): void {
    if (this.menuOpen()) {
      this.closeMenu();
      return;
    }
    const dialog = this.mobileMenu?.nativeElement;
    if (!dialog) return;
    clearTimeout(this.closeTimer);
    this.lockScroll();
    if (!dialog.open) dialog.showModal();
    this.menuOpen.set(true);
    afterNextRender(
      () => {
        if (this.menuOpen()) dialog.querySelector<HTMLAnchorElement>('nav a')?.focus();
      },
      { injector: this.injector },
    );
  }

  private lockScroll(): void {
    const window = this.document.defaultView;
    if (!window || this.restoreScroll) return;
    const body = this.document.body;
    const properties = ['position', 'top', 'left', 'right', 'overflow'] as const;
    const previous = properties.map((key) => [
      key,
      body.style.getPropertyValue(key),
      body.style.getPropertyPriority(key),
    ]);
    const x = window.scrollX;
    const y = window.scrollY;
    body.style.position = 'fixed';
    body.style.top = `-${y}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
    this.restoreScroll = () => {
      for (const [key, value, priority] of previous) {
        if (value) body.style.setProperty(key, value, priority);
        else body.style.removeProperty(key);
      }
      window.scrollTo({ left: x, top: y, behavior: 'instant' });
    };
  }

  private unlockScroll(): void {
    this.restoreScroll?.();
    this.restoreScroll = undefined;
  }
}
