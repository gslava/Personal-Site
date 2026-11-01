import { AfterViewInit, DestroyRef, Directive, ElementRef, inject } from '@angular/core';

@Directive({ selector: '[appIllustrationLight]' })
export class IllustrationLightDirective implements AfterViewInit {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroy = inject(DestroyRef);

  ngAfterViewInit(): void {
    const frame = this.element.nativeElement.querySelector<HTMLElement>('.illustration-frame');
    const light = frame?.querySelector<HTMLElement>('.illustration-light');
    const view = this.element.nativeElement.ownerDocument.defaultView;
    if (!frame || !light || !view?.matchMedia) return;

    const finePointer = view.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
    let pending = 0;
    let position: { x: number; y: number } | undefined;
    const hide = () => {
      frame.classList.remove('is-lit');
      if (pending) view.cancelAnimationFrame(pending);
      pending = 0;
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || !finePointer.matches || reducedMotion.matches) {
        hide();
        return;
      }
      position = { x: event.clientX, y: event.clientY };
      frame.classList.add('is-lit');
      if (pending) return;
      pending = view.requestAnimationFrame(() => {
        pending = 0;
        if (!position) return;
        const bounds = frame.getBoundingClientRect();
        const x = Math.max(0, Math.min(bounds.width, position.x - bounds.left));
        const y = Math.max(0, Math.min(bounds.height, position.y - bounds.top));
        light.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      });
    };
    const preferenceChanged = () => {
      if (!finePointer.matches || reducedMotion.matches) hide();
    };

    frame.addEventListener('pointermove', move);
    frame.addEventListener('pointerleave', hide);
    finePointer.addEventListener('change', preferenceChanged);
    reducedMotion.addEventListener('change', preferenceChanged);
    this.destroy.onDestroy(() => {
      frame.removeEventListener('pointermove', move);
      frame.removeEventListener('pointerleave', hide);
      finePointer.removeEventListener('change', preferenceChanged);
      reducedMotion.removeEventListener('change', preferenceChanged);
      hide();
    });
  }
}
