import { Directive, ElementRef, DestroyRef, afterNextRender, inject } from '@angular/core';
import { entranceTiming, onceInView } from '../motion/once-in-view';

@Directive({ selector: '[appEntrance]' })
export class EntranceDirective {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroy = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const element = this.element.nativeElement;
      const stop = onceInView(element, () => {
        const animation = element.animate(
          [
            { transform: 'translateY(12px)', opacity: 0.6 },
            { transform: 'translateY(0)', opacity: 1 },
          ],
          entranceTiming(element),
        );
        return () => animation.cancel();
      });
      this.destroy.onDestroy(stop);
    });
  }
}
