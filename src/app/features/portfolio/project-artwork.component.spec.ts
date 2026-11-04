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
    document.documentElement.lang = 'en';
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
    expect(
      root.querySelectorAll('.case-interface img[alt="Inventory workspace illustration"]'),
    ).toHaveLength(1);
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
  // jsdom has no native modal layer; keyboard trapping is verified in a browser.
  function preview() {
    const result = render();
    const dialog = result.root.querySelector('dialog')!;
    dialog.showModal = () => {
      dialog.open = true;
    };
    dialog.close = () => {
      dialog.open = false;
      dialog.dispatchEvent(new Event('close'));
    };
    const trigger = result.root.querySelector<HTMLButtonElement>('.case-interface')!;
    const close = result.root.querySelector<HTMLButtonElement>('.artwork-preview__close')!;
    return { ...result, dialog, trigger, close };
  }

  it('opens inline without navigation and restores scroll styles and focus on close', () => {
    const { dialog, trigger, close } = preview();
    document.documentElement.style.overflow = 'auto';
    trigger.focus();
    trigger.click();
    expect(dialog.open).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(dialog.querySelector('img')?.getAttribute('src')).toBe(
      'images/projects/inventory-management.webp',
    );
    close.click();
    expect(dialog.open).toBe(false);
    expect(document.documentElement.style.overflow).toBe('auto');
    expect(document.activeElement).toBe(trigger);
    document.documentElement.style.overflow = '';
  });

  it('opens from the enlarge action and closes on Escape cancellation', () => {
    const { root, dialog } = preview();
    root.querySelector<HTMLButtonElement>('.preview-link')!.click();
    expect(dialog.open).toBe(true);
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('releases the page when the case changes or the component is destroyed', () => {
    const { fixture, dialog, trigger } = preview();
    trigger.click();
    fixture.componentRef.setInput('slug', 'amazon-ads');
    fixture.detectChanges();
    expect(dialog.open).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
    trigger.click();
    fixture.destroy();
    expect(document.documentElement.style.overflow).toBe('');
  });
  it('closes on the surrounding area while clicks on the image keep the preview open', () => {
    const { dialog, trigger } = preview();
    trigger.click();
    dialog.querySelector('img')!.click();
    expect(dialog.open).toBe(true);
    dialog.click();
    expect(dialog.open).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
  });
});
