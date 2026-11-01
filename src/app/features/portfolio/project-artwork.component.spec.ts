import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectArtworkComponent } from './project-artwork.component';

describe('ProjectArtworkComponent', () => {
  let touch: boolean;
  let change: () => void;
  let removeListener: ReturnType<typeof vi.fn>;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    touch = true;
    originalMatchMedia = window.matchMedia;
    removeListener = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({
        get matches() {
          return touch;
        },
        addEventListener: (_type: string, listener: () => void) => {
          change = listener;
        },
        removeEventListener: removeListener,
      }),
    });
    await TestBed.configureTestingModule({
      imports: [ProjectArtworkComponent],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: originalMatchMedia });
  });

  function render() {
    const fixture = TestBed.createComponent(ProjectArtworkComponent);
    fixture.componentRef.setInput('slug', 'inventory-management');
    fixture.componentRef.setInput('imageAlt', 'Inventory workspace illustration');
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const load = () => root.querySelector('img')?.dispatchEvent(new Event('load'));
    const revealed = () =>
      root.querySelector('.case-interface')?.classList.contains('case-interface--revealed');
    return { fixture, root, load, revealed };
  }

  it('waits a full second after the actual image load before revealing on touch', () => {
    const { fixture, load, revealed } = render();
    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(revealed()).toBe(false);
    load();
    vi.advanceTimersByTime(999);
    fixture.detectChanges();
    expect(revealed()).toBe(false);
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(revealed()).toBe(true);
  });

  it('leaves desktop reveal to hover and exposes only one descriptive image', () => {
    touch = false;
    const { fixture, root, load, revealed } = render();
    load();
    vi.advanceTimersByTime(2000);
    fixture.detectChanges();
    expect(revealed()).toBe(false);
    expect(root.querySelectorAll('img[alt="Inventory workspace illustration"]')).toHaveLength(1);
    expect(root.querySelector('.case-interface__color')?.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('a')).toBeNull();
    expect(root.querySelector('[href], [target], [tabindex]')).toBeNull();
  });

  it('cancels a pending reveal and starts again when the next project loads', () => {
    const { fixture, load, revealed } = render();
    load();
    vi.advanceTimersByTime(500);
    fixture.componentRef.setInput('slug', 'amazon-ads');
    fixture.detectChanges();
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(revealed()).toBe(false);
    load();
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(revealed()).toBe(true);
  });

  it('updates pointer capability and clears timers and listeners on destroy', () => {
    const { fixture, load, revealed } = render();
    load();
    touch = false;
    change();
    vi.advanceTimersByTime(1500);
    fixture.detectChanges();
    expect(revealed()).toBe(false);
    touch = true;
    change();
    expect(vi.getTimerCount()).toBe(1);
    fixture.destroy();
    expect(vi.getTimerCount()).toBe(0);
    expect(removeListener).toHaveBeenCalledWith('change', change);
  });
});
