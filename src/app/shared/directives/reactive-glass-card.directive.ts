import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  NgZone,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appReactiveGlassCard]',
  standalone: true,
})
export class ReactiveGlassCardDirective implements OnInit {
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private pointerX = 0.5;
  private pointerY = 0.5;
  private targetRotateX = 0;
  private targetRotateY = 0;
  private frameId: number | null = null;
  private isActive = false;

  ngOnInit(): void {
    const windowRef = this.document.defaultView;

    if (!isPlatformBrowser(this.platformId) || !windowRef || !this.supportsInteractiveGlass(windowRef)) {
      return;
    }

    const element = this.elementRef.nativeElement;
    const handlePointerEnter = (event: PointerEvent): void => {
      this.isActive = true;
      element.classList.add('reactive-glass-card--active');
      this.updateFromPointer(event);
    };
    const handlePointerMove = (event: PointerEvent): void => {
      this.updateFromPointer(event);
    };
    const handlePointerLeave = (): void => {
      this.isActive = false;
      element.classList.remove('reactive-glass-card--active');
      this.pointerX = 0.5;
      this.pointerY = 0.5;
      this.targetRotateX = 0;
      this.targetRotateY = 0;
      this.scheduleFrame(windowRef);
    };

    element.style.setProperty('--glass-pointer-x', '50%');
    element.style.setProperty('--glass-pointer-y', '50%');
    element.style.setProperty('--glass-rotate-x', '0deg');
    element.style.setProperty('--glass-rotate-y', '0deg');
    element.addEventListener('pointerenter', handlePointerEnter, { passive: true });
    element.addEventListener('pointermove', handlePointerMove, { passive: true });
    element.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    this.destroyRef.onDestroy(() => {
      if (this.frameId !== null) {
        windowRef.cancelAnimationFrame(this.frameId);
      }

      element.removeEventListener('pointerenter', handlePointerEnter);
      element.removeEventListener('pointermove', handlePointerMove);
      element.removeEventListener('pointerleave', handlePointerLeave);
    });
  }

  private supportsInteractiveGlass(windowRef: Window): boolean {
    const prefersReducedMotion = windowRef.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const supportsHover = windowRef.matchMedia?.('(hover: hover)').matches ?? false;
    const finePointer = windowRef.matchMedia?.('(pointer: fine)').matches ?? false;

    return !prefersReducedMotion && supportsHover && finePointer;
  }

  private updateFromPointer(event: PointerEvent): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const normalizedX = clamp((event.clientX - rect.left) / Math.max(rect.width, 1), 0, 1);
    const normalizedY = clamp((event.clientY - rect.top) / Math.max(rect.height, 1), 0, 1);

    this.pointerX = normalizedX;
    this.pointerY = normalizedY;
    this.targetRotateX = (0.5 - normalizedY) * 2.2;
    this.targetRotateY = (normalizedX - 0.5) * 2.8;

    const windowRef = this.document.defaultView;
    if (windowRef) {
      this.scheduleFrame(windowRef);
    }
  }

  private scheduleFrame(windowRef: Window): void {
    if (this.frameId !== null) {
      return;
    }

    this.ngZone.runOutsideAngular(() => {
      this.frameId = windowRef.requestAnimationFrame(() => {
        this.frameId = null;
        this.flushStyles();
      });
    });
  }

  private flushStyles(): void {
    const element = this.elementRef.nativeElement;

    element.style.setProperty('--glass-pointer-x', `${(this.pointerX * 100).toFixed(2)}%`);
    element.style.setProperty('--glass-pointer-y', `${(this.pointerY * 100).toFixed(2)}%`);
    element.style.setProperty('--glass-rotate-x', `${this.targetRotateX.toFixed(2)}deg`);
    element.style.setProperty('--glass-rotate-y', `${this.targetRotateY.toFixed(2)}deg`);
    element.style.setProperty('--glass-highlight-opacity', this.isActive ? '1' : '0');
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
