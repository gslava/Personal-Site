import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  DestroyRef,
  Directive,
  ElementRef,
  NgZone,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true,
  host: {
    '[class.scroll-reveal--visible]': 'isVisible()',
    '[class.scroll-reveal--instant]': 'skipAnimation()',
    '[attr.data-scroll-reveal]': 'isReady() ? "ready" : null',
  },
})
export class ScrollRevealDirective implements AfterViewInit {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly isReady = signal(false);
  protected readonly isVisible = signal(false);
  protected readonly skipAnimation = signal(false);

  private lastScrollY = 0;
  private scrollDirection: 'up' | 'down' = 'down';

  ngAfterViewInit(): void {
    const windowRef = this.document.defaultView;

    if (
      !isPlatformBrowser(this.platformId) ||
      !windowRef ||
      typeof IntersectionObserver === 'undefined' ||
      this.prefersReducedMotion(windowRef)
    ) {
      return;
    }

    this.lastScrollY = windowRef.scrollY;

    const handleScroll = (): void => {
      const nextScrollY = windowRef.scrollY;

      this.scrollDirection = nextScrollY < this.lastScrollY ? 'up' : 'down';
      this.lastScrollY = nextScrollY;
    };

    const target = this.elementRef.nativeElement;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const nextVisible = (entry?.isIntersecting ?? false) && (entry?.intersectionRatio ?? 0) > 0;

        if (!nextVisible) {
          this.ngZone.run(() => {
            this.skipAnimation.set(false);
            this.isVisible.set(false);
          });
          return;
        }

        if (this.scrollDirection === 'up') {
          this.revealWithoutAnimation(windowRef);
          return;
        }

        this.ngZone.run(() => {
          this.skipAnimation.set(false);
          this.isVisible.set(true);
        });
      },
      {
        threshold: [0, 0.18, 0.4],
        rootMargin: '0px 0px -10% 0px',
      },
    );

    this.isReady.set(true);
    observer.observe(target);
    windowRef.addEventListener('scroll', handleScroll, { passive: true });

    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      windowRef.removeEventListener('scroll', handleScroll);
    });
  }

  private prefersReducedMotion(windowRef: Window): boolean {
    return windowRef.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private revealWithoutAnimation(windowRef: Window): void {
    this.ngZone.run(() => {
      this.skipAnimation.set(true);
      this.isVisible.set(true);
    });

    windowRef.requestAnimationFrame(() => {
      this.ngZone.run(() => {
        this.skipAnimation.set(false);
      });
    });
  }
}
