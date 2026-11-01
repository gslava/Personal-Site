import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ReadingTimelineDirective } from './reading-timeline.directive';

@Component({
  imports: [ReadingTimelineDirective],
  template: `<div [appReadingTimeline]="enabled">
    <article>First</article>
    <article>Second</article>
  </div>`,
})
class TimelineHostComponent {
  enabled = true;
}

describe('ReadingTimelineDirective', () => {
  it('moves the current marker to the job crossing the reading line', async () => {
    await TestBed.configureTestingModule({ imports: [TimelineHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TimelineHostComponent);
    fixture.detectChanges();
    const articles = fixture.nativeElement.querySelectorAll('article') as NodeListOf<HTMLElement>;
    let secondTop = window.innerHeight;
    articles[0].getBoundingClientRect = () => ({ top: -10 }) as DOMRect;
    articles[1].getBoundingClientRect = () => ({ top: secondTop }) as DOMRect;

    const callbacks: FrameRequestCallback[] = [];
    const frame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    window.dispatchEvent(new Event('scroll'));
    callbacks.shift()?.(0);
    expect(articles[0].classList.contains('is-current')).toBe(true);
    expect(articles[1].classList.contains('is-current')).toBe(false);

    secondTop = 0;
    window.dispatchEvent(new Event('scroll'));
    callbacks.shift()?.(0);
    expect(articles[0].classList.contains('is-current')).toBe(false);
    expect(articles[1].classList.contains('is-current')).toBe(true);

    fixture.destroy();
    frame.mockRestore();
    cancel.mockRestore();
  });
});
