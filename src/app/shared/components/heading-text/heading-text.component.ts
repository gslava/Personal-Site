import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterEveryRender,
  computed,
  inject,
  input,
} from '@angular/core';
import { entranceTiming, onceInView } from '../../motion/once-in-view';

@Component({
  selector: 'app-heading-text',
  template: `@for (part of parts(); track $index) {
    @if (part.trim()) {
      <span class="heading-word-mask"
        ><span class="heading-word">{{ part }}</span></span
      >
    } @else {
      <ng-container>{{ part }}</ng-container>
    }
  }`,
  styles: `
    :host {
      display: contents;
    }
    .heading-word-mask {
      display: inline-block;
      vertical-align: top;
      overflow: clip;
      max-width: 100%;
      padding-block: 0.12em;
      margin-block: -0.12em;
    }
    .heading-word {
      display: inline-block;
      max-width: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeadingTextComponent {
  readonly text = input.required<string>();
  protected readonly parts = computed(() => this.text().split(/(\s+)/).filter(Boolean));
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private stop = () => undefined as void;

  constructor() {
    let renderedText: string | undefined;
    // Angular owns the text nodes, including updates when a case route is reused.
    afterEveryRender(() => {
      const text = this.text();
      if (renderedText === text) return;
      renderedText = text;
      this.stop();
      const host = this.element.nativeElement;
      const heading = host.parentElement;
      if (!heading) return;
      this.stop = onceInView(heading, () => {
        const words = Array.from(host.querySelectorAll<HTMLElement>('.heading-word'));
        // Measure actual wrapping at entrance time, including locale and viewport width.
        const tops = words.map((word) => word.parentElement!.getBoundingClientRect().top);
        const lines: number[] = [];
        const timing = entranceTiming(heading);
        const animations = words.map((word, index) => {
          let line = lines.findIndex((top) => Math.abs(top - tops[index]) < 2);
          if (line < 0) line = lines.push(tops[index]) - 1;
          return word.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0)' }], {
            ...timing,
            delay: Math.min(line, 3) * 45,
            fill: 'backwards',
          });
        });
        return () => animations.forEach((animation) => animation.cancel());
      });
    });
    inject(DestroyRef).onDestroy(() => this.stop());
  }
}
