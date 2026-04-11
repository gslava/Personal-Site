import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReactiveGlassCardDirective } from './reactive-glass-card.directive';

@Component({
  standalone: true,
  imports: [ReactiveGlassCardDirective],
  template: '<section appReactiveGlassCard class="target">Card</section>',
})
class TestHostComponent {}

describe('ReactiveGlassCardDirective', () => {
  let originalMatchMedia: typeof window.matchMedia | undefined;
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame;
  let originalCancelAnimationFrame: typeof window.cancelAnimationFrame;
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(async () => {
    rafCallbacks = [];
    originalMatchMedia = window.matchMedia;
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query === '(hover: hover)' || query === '(pointer: fine)',
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        rafCallbacks.push(callback);
        return rafCallbacks.length;
      },
    });

    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: () => {},
    });

    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();
  });

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: originalMatchMedia,
    });
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: originalRequestAnimationFrame,
    });
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: originalCancelAnimationFrame,
    });
  });

  it('updates pointer-driven css variables and active state', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const target = fixture.nativeElement.querySelector('.target') as HTMLElement;
    target.getBoundingClientRect = () =>
      ({
        left: 100,
        top: 200,
        width: 400,
        height: 200,
      }) as DOMRect;

    target.dispatchEvent(
      new MouseEvent('pointerenter', {
        clientX: 300,
        clientY: 250,
      }),
    );
    rafCallbacks.shift()?.(16);
    fixture.detectChanges();

    expect(target.classList.contains('reactive-glass-card--active')).toBe(true);

    target.dispatchEvent(
      new MouseEvent('pointermove', {
        clientX: 420,
        clientY: 340,
      }),
    );
    rafCallbacks.shift()?.(32);
    fixture.detectChanges();

    expect(parseFloat(target.style.getPropertyValue('--glass-pointer-x'))).toBeCloseTo(80, 2);
    expect(parseFloat(target.style.getPropertyValue('--glass-pointer-y'))).toBeCloseTo(70, 2);
    expect(target.style.getPropertyValue('--glass-highlight-opacity')).toBe('1');

    target.dispatchEvent(new MouseEvent('pointerleave'));
    rafCallbacks.shift()?.(48);
    fixture.detectChanges();

    expect(target.classList.contains('reactive-glass-card--active')).toBe(false);
    expect(parseFloat(target.style.getPropertyValue('--glass-pointer-x'))).toBeCloseTo(50, 2);
    expect(parseFloat(target.style.getPropertyValue('--glass-pointer-y'))).toBeCloseTo(50, 2);
    expect(target.style.getPropertyValue('--glass-rotate-x')).toBe('0.00deg');
    expect(target.style.getPropertyValue('--glass-rotate-y')).toBe('0.00deg');
    expect(target.style.getPropertyValue('--glass-highlight-opacity')).toBe('0');
  });
});
