import { Directive, ElementRef, DestroyRef, afterNextRender, inject, input } from '@angular/core';
import { onceInView } from '../motion/once-in-view';

@Directive({
  selector: '[appRuleReveal]',
  host: {
    class: 'motion-rule',
    '[class.motion-rule--bottom]': 'edge() === "bottom"',
    '[class.motion-rule--top]': 'edge() !== "bottom"',
  },
})
export class RuleRevealDirective {
  readonly edge = input('', { alias: 'appRuleReveal' });
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroy = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      const element = this.element.nativeElement;
      const stop = onceInView(element, () => {
        element.classList.add('motion-rule--enter');
        return () => element.classList.remove('motion-rule--enter');
      });
      this.destroy.onDestroy(stop);
    });
  }
}
