import { vi } from 'vitest';
import { onceInView } from './once-in-view';

describe('onceInView', () => {
  let intersect: IntersectionObserverCallback;
  let disconnect: ReturnType<typeof vi.fn>;
  let matches: boolean;
  let listener: (() => void) | undefined;
  let removeListener: ReturnType<typeof vi.fn>;
  let target: HTMLElement;

  beforeEach(() => {
    matches = false;
    target = document.createElement('h2');
    target.textContent = 'Visible without animation';
    target.animate = vi.fn();
    disconnect = vi.fn();
    removeListener = vi.fn();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          intersect = callback;
        }
        observe = vi.fn();
        disconnect = disconnect;
      },
    );
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        get matches() {
          return matches;
        },
        addEventListener: (_: string, fn: () => void) => {
          listener = fn;
        },
        removeEventListener: removeListener,
      })),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  function enter(isIntersecting: boolean) {
    intersect([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
  }

  it('plays only on the first entrance, preserving the readable resting content', () => {
    const cancel = vi.fn();
    const play = vi.fn(() => cancel);
    const stop = onceInView(target, play);
    expect(target.textContent).toBe('Visible without animation');
    expect(target.style.opacity).toBe('');
    enter(false);
    expect(play).not.toHaveBeenCalled();
    enter(true);
    enter(false);
    enter(true);
    expect(play).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalled();
    stop();
    expect(cancel).toHaveBeenCalled();
    expect(removeListener).toHaveBeenCalled();
  });

  it('does not animate when reduced motion is already selected', () => {
    matches = true;
    const play = vi.fn();
    onceInView(target, play)();
    expect(play).not.toHaveBeenCalled();
    expect(target.textContent).toBe('Visible without animation');
    expect(disconnect).not.toHaveBeenCalled();
  });

  it('cancels active motion and never replays when the preference changes', () => {
    const cancel = vi.fn();
    const play = vi.fn(() => cancel);
    const stop = onceInView(target, play);
    enter(true);
    matches = true;
    listener!();
    expect(cancel).toHaveBeenCalledTimes(1);
    matches = false;
    listener!();
    enter(true);
    expect(play).toHaveBeenCalledTimes(1);
    stop();
  });

  it('ignores queued intersection callbacks after teardown', () => {
    const play = vi.fn();
    const stop = onceInView(target, play);
    stop();
    enter(true);
    expect(play).not.toHaveBeenCalled();
  });

  it('leaves content visible when IntersectionObserver is unavailable', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const play = vi.fn();
    onceInView(target, play)();
    expect(play).not.toHaveBeenCalled();
    expect(target.textContent).toBe('Visible without animation');
  });
});
