import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrollRevealDirective } from './scroll-reveal.directive';

type MockIntersectionObserverEntry = Pick<IntersectionObserverEntry, 'intersectionRatio' | 'isIntersecting' | 'target'>;

class MockIntersectionObserver {
  private observedTarget: Element | null = null;

  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe(target: Element): void {
    this.observedTarget = target;
  }

  disconnect(): void {}

  emit(entry: Partial<MockIntersectionObserverEntry>): void {
    if (!this.observedTarget) {
      throw new Error('No observed target was registered.');
    }

    this.callback(
      [
        {
          intersectionRatio: entry.intersectionRatio ?? 0,
          isIntersecting: entry.isIntersecting ?? false,
          target: this.observedTarget,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    );
  }
}

@Component({
  standalone: true,
  imports: [ScrollRevealDirective],
  template: '<section appScrollReveal class="target">Animated section</section>',
})
class TestHostComponent {}

describe('ScrollRevealDirective', () => {
  let originalIntersectionObserver: typeof IntersectionObserver | undefined;
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
  let createdObservers: MockIntersectionObserver[];
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(async () => {
    createdObservers = [];
    rafCallbacks = [];
    originalIntersectionObserver = globalThis.IntersectionObserver;
    originalRequestAnimationFrame = window.requestAnimationFrame;

    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        rafCallbacks.push(callback);
        return rafCallbacks.length;
      },
    });

    globalThis.IntersectionObserver = class {
      constructor(callback: IntersectionObserverCallback) {
        const observer = new MockIntersectionObserver(callback);
        createdObservers.push(observer);

        return observer as unknown as IntersectionObserver;
      }
    } as typeof IntersectionObserver;

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalIntersectionObserver as typeof IntersectionObserver;
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: originalRequestAnimationFrame,
    });
  });

  it('toggles reveal visibility when the element enters and exits the viewport', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const target = fixture.nativeElement.querySelector('.target') as HTMLElement;
    const observer = createdObservers[0];

    expect(target.getAttribute('data-scroll-reveal')).toBe('ready');
    expect(target.classList.contains('scroll-reveal--visible')).toBe(false);

    observer.emit({
      isIntersecting: true,
      intersectionRatio: 0.42,
    });
    fixture.detectChanges();

    expect(target.classList.contains('scroll-reveal--visible')).toBe(true);

    observer.emit({
      isIntersecting: false,
      intersectionRatio: 0,
    });
    fixture.detectChanges();

    expect(target.classList.contains('scroll-reveal--visible')).toBe(false);
  });

  it('shows the element instantly when re-entering during upward scroll', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const target = fixture.nativeElement.querySelector('.target') as HTMLElement;
    const observer = createdObservers[0];

    observer.emit({
      isIntersecting: true,
      intersectionRatio: 0.42,
    });
    fixture.detectChanges();

    observer.emit({
      isIntersecting: false,
      intersectionRatio: 0,
    });
    fixture.detectChanges();

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 320,
    });
    window.dispatchEvent(new Event('scroll'));

    Object.defineProperty(window, 'scrollY', {
      configurable: true,
      value: 120,
    });
    window.dispatchEvent(new Event('scroll'));

    observer.emit({
      isIntersecting: true,
      intersectionRatio: 0.42,
    });
    fixture.detectChanges();

    expect(target.classList.contains('scroll-reveal--visible')).toBe(true);
    expect(target.classList.contains('scroll-reveal--instant')).toBe(true);

    const queuedFrame = rafCallbacks.shift();
    expect(queuedFrame).toBeDefined();
  });
});
