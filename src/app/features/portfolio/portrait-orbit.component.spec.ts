import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PortraitOrbitComponent } from './portrait-orbit.component';

describe('portrait particle sphere', () => {
  let reduced: boolean;
  let changed: () => void;
  let remove: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    document.documentElement.lang = 'en';
    reduced = false;
    remove = vi.fn();
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return reduced;
      },
      addEventListener: (_event: string, callback: () => void) => {
        changed = callback;
      },
      removeEventListener: remove,
    }));
    await TestBed.configureTestingModule({ imports: [PortraitOrbitComponent] }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  function render() {
    const fixture = TestBed.createComponent(PortraitOrbitComponent);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const button = root.querySelector('button')!;
    return { fixture, root, button };
  }

  it('shows the portrait without a background circle when reduced motion is requested', () => {
    reduced = true;
    const { root, button } = render();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Play animation');
    expect(root.querySelector('app-particle-sphere')).toBeNull();
    expect(root.querySelector('img')?.getAttribute('src')).toBe('images/viacheslav-avatar.png');
    expect(root.querySelector('.portrait-orbit__still')).toBeNull();
  });

  it('lets the user pause and restart the sphere while preserving the portrait', () => {
    const { fixture, root, button } = render();
    const image = root.querySelector('img');
    expect(button.getAttribute('aria-pressed')).toBe('true');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Play animation');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(root.querySelector('img')).toBe(image);
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Pause animation');
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('responds to motion preferences and removes its listener when leaving About', () => {
    const { fixture, button } = render();
    reduced = true;
    changed();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    fixture.destroy();
    expect(remove).toHaveBeenCalledWith('change', changed);
  });
});
