import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { SiteShellComponent } from './site-shell.component';

// jsdom has no modal top layer. Focus containment and inertness are browser checks.
describe('SiteShellComponent mobile menu', () => {
  let media: Map<string, { matches: boolean; listeners: Set<() => void> }>;

  beforeEach(async () => {
    document.documentElement.lang = 'en';
    media = new Map();
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => {
        const state = { matches: false, listeners: new Set<() => void>() };
        media.set(query, state);
        return {
          get matches() {
            return state.matches;
          },
          addEventListener: (_: string, fn: () => void) => state.listeners.add(fn),
          removeEventListener: (_: string, fn: () => void) => state.listeners.delete(fn),
        } as unknown as MediaQueryList;
      }),
    );
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({
      imports: [SiteShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function render() {
    const fixture = TestBed.createComponent(SiteShellComponent);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const dialog = root.querySelector('dialog')!;
    dialog.showModal = () => {
      dialog.open = true;
    };
    dialog.close = () => {
      dialog.open = false;
      dialog.dispatchEvent(new Event('close'));
    };
    const trigger = root.querySelector<HTMLButtonElement>('.menu-button')!;
    const close = root.querySelector<HTMLButtonElement>('.mobile-menu__close')!;
    return { fixture, root, dialog, trigger, close };
  }

  it('keeps the dialog modal during its exit then restores scroll styles and trigger focus', async () => {
    const { fixture, dialog, trigger, close } = await render();
    document.body.style.overflow = 'auto';
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 480 });
    trigger.click();
    await fixture.whenStable();
    expect(dialog.open).toBe(true);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-480px');
    const focus = vi.spyOn(trigger, 'focus');
    vi.useFakeTimers();
    close.click();
    fixture.detectChanges();
    expect(dialog.open).toBe(true);
    expect(dialog.classList.contains('mobile-menu--closing')).toBe(true);
    vi.advanceTimersByTime(240);
    expect(dialog.open).toBe(false);
    expect(document.body.style.position).toBe('');
    expect(document.body.style.overflow).toBe('auto');
    expect(window.scrollTo).toHaveBeenCalledWith({ left: 0, top: 480, behavior: 'instant' });
    expect(focus).toHaveBeenCalled();
    document.body.style.overflow = '';
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });

  it('handles Escape with reduced motion immediately', async () => {
    const { fixture, dialog, trigger } = await render();
    trigger.click();
    await fixture.whenStable();
    // closeMenu queries the current preference, including changes after opening.
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
    const cancel = new Event('cancel', { cancelable: true });
    dialog.dispatchEvent(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(dialog.open).toBe(false);
    expect(document.body.style.position).toBe('');
  });

  it('releases the scroll lock on navigation, desktop resize and destruction', async () => {
    const { fixture, dialog, trigger } = await render();
    trigger.click();
    await fixture.whenStable();
    await TestBed.inject(Router).navigateByUrl('/');
    expect(dialog.open).toBe(false);
    expect(document.body.style.position).toBe('');
    trigger.click();
    await fixture.whenStable();
    const desktop = media.get('(min-width: 961px)')!;
    desktop.matches = true;
    desktop.listeners.forEach((fn) => fn());
    expect(dialog.open).toBe(false);
    expect(document.body.style.position).toBe('');
    trigger.click();
    await fixture.whenStable();
    fixture.destroy();
    expect(document.body.style.position).toBe('');
    expect(desktop.listeners.size).toBe(0);
  });

  it('cancels a pending close when reopened and preserves CV and locale links', async () => {
    const { fixture, root, dialog, trigger, close } = await render();
    trigger.click();
    await fixture.whenStable();
    vi.useFakeTimers();
    close.click();
    trigger.click();
    fixture.detectChanges();
    vi.advanceTimersByTime(500);
    expect(dialog.open).toBe(true);
    expect(dialog.querySelector('a[download]')?.getAttribute('href')).toBe(
      'cv/viacheslav-guzhov-cv.pdf',
    );
    expect(dialog.querySelectorAll('[data-locale-link]')).toHaveLength(3);
    expect(root.querySelectorAll('#primary-navigation a')).toHaveLength(4);
    fixture.destroy();
  });
});
