import { AfterViewInit, DestroyRef, Directive, ElementRef, Input, inject } from '@angular/core';

@Directive({ selector: '[appReadingTimeline]' })
export class ReadingTimelineDirective implements AfterViewInit {
  @Input() appReadingTimeline = false;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroy = inject(DestroyRef);

  ngAfterViewInit(): void {
    if (!this.appReadingTimeline) return;

    const timeline = this.element.nativeElement;
    const articles = Array.from(timeline.querySelectorAll<HTMLElement>('article'));
    const view = timeline.ownerDocument.defaultView;
    if (!view || articles.length === 0) return;

    let frame = 0;
    let active = -1;
    const update = () => {
      frame = 0;
      const readingLine = view.innerHeight * 0.38;
      let next = 0;
      for (let index = 1; index < articles.length; index++) {
        if (articles[index].getBoundingClientRect().top <= readingLine) next = index;
      }
      if (next === active) return;
      articles[active]?.classList.remove('is-current');
      articles[next].classList.add('is-current');
      active = next;
    };
    const schedule = () => {
      if (!frame) frame = view.requestAnimationFrame(update);
    };

    update();
    view.addEventListener('scroll', schedule, { passive: true });
    view.addEventListener('resize', schedule);
    this.destroy.onDestroy(() => {
      view.removeEventListener('scroll', schedule);
      view.removeEventListener('resize', schedule);
      if (frame) view.cancelAnimationFrame(frame);
    });
  }
}
