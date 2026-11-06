import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachMotifParticles } from './project-motif-particles';

describe('portfolio particle activity', () => {
  let trigger: HTMLAnchorElement;
  let host: HTMLElement;
  let intersect: (entries: { isIntersecting: boolean }[]) => void;
  let reduced: boolean;
  let fine: boolean;
  let preferenceChanged: () => void;
  let frames: Map<number, FrameRequestCallback>;
  let disconnect: ReturnType<typeof vi.fn>;
  let dispose: (() => void) | undefined;

  beforeEach(() => {
    reduced = false;
    fine = true;
    frames = new Map();
    disconnect = vi.fn();
    let id = 0;
    vi.spyOn(performance, 'now').mockReturnValue(100);
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.set(++id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (frame: number) => frames.delete(frame));
    vi.stubGlobal('matchMedia', (query: string) => ({
      get matches() {
        return query.includes('reduced-motion') ? reduced : fine;
      },
      addEventListener: (_event: string, callback: () => void) => {
        preferenceChanged = callback;
      },
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof intersect) {
          intersect = callback;
        }
        observe = vi.fn();
        disconnect = disconnect;
      },
    );
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = vi.fn();
        disconnect = disconnect;
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    } as unknown as ReturnType<HTMLCanvasElement['getContext']>);
    trigger = document.createElement('a');
    trigger.className = 'work-portal__link';
    host = document.createElement('app-project-motif');
    host.innerHTML = '<canvas></canvas>';
    trigger.append(host);
    document.body.append(trigger);
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    trigger.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function nextFrame(now: number): void {
    vi.mocked(performance.now).mockReturnValue(now);
    const [id, callback] = [...frames.entries()][0];
    frames.delete(id);
    callback(now);
  }

  it('shows a bounded preview and then releases the animation loop', () => {
    dispose = attachMotifParticles(host, 'work-overview');
    expect(frames.size).toBe(0);
    intersect([{ isIntersecting: true }]);
    nextFrame(120);
    expect(host.hasAttribute('data-particles-active')).toBe(true);
    nextFrame(4000);
    expect(frames.size).toBe(0);
    expect(host.hasAttribute('data-particles-active')).toBe(false);
    intersect([{ isIntersecting: false }]);
    intersect([{ isIntersecting: true }]);
    expect(frames.size).toBe(0);
  });

  it('keeps touch and reduced-motion views static, including preference changes', () => {
    reduced = true;
    dispose = attachMotifParticles(host, 'work-overview');
    intersect([{ isIntersecting: true }]);
    trigger.dispatchEvent(new Event('pointerenter'));
    expect(frames.size).toBe(0);
    reduced = false;
    fine = false;
    preferenceChanged();
    trigger.dispatchEvent(new Event('pointerenter'));
    expect(frames.size).toBe(0);
    fine = true;
    preferenceChanged();
    trigger.dispatchEvent(new Event('pointerenter'));
    nextFrame(120);
    expect(host.hasAttribute('data-particles-active')).toBe(true);
    reduced = true;
    preferenceChanged();
    expect(frames.size).toBe(0);
    expect(host.hasAttribute('data-particles-active')).toBe(false);
  });

  it('runs project flows only during interaction and cancels work offscreen', () => {
    dispose = attachMotifParticles(host, 'inventory-management');
    intersect([{ isIntersecting: true }]);
    expect(frames.size).toBe(0);
    trigger.dispatchEvent(new Event('pointerenter'));
    expect(frames.size).toBe(1);
    intersect([{ isIntersecting: false }]);
    expect(frames.size).toBe(0);
    intersect([{ isIntersecting: true }]);
    expect(frames.size).toBe(0);
    trigger.dispatchEvent(new FocusEvent('focusin'));
    expect(frames.size).toBe(1);
    trigger.dispatchEvent(new FocusEvent('focusout'));
    nextFrame(800);
    expect(frames.size).toBe(0);
  });

  it('disconnects observers, cancels frames and removes interaction listeners on teardown', () => {
    dispose = attachMotifParticles(host, 'work-overview');
    intersect([{ isIntersecting: true }]);
    nextFrame(120);
    dispose();
    expect(disconnect).toHaveBeenCalledTimes(2);
    expect(frames.size).toBe(0);
    expect(host.hasAttribute('data-particles-active')).toBe(false);
    trigger.dispatchEvent(new Event('pointerenter'));
    trigger.dispatchEvent(new FocusEvent('focusin'));
    expect(frames.size).toBe(0);
  });
});
