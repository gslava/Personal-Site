/** Progressive enhancement: the resting content is always visible. */
export function onceInView(element: HTMLElement, play: () => () => void): () => void {
  const window = element.ownerDocument.defaultView;
  if (!window?.matchMedia || typeof IntersectionObserver === 'undefined' || !element.animate) {
    return () => undefined;
  }
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (preference.matches) return () => undefined;
  let played = false;
  let cancel: (() => void) | undefined;
  const observer = new IntersectionObserver(
    (entries) => {
      if (played || !entries.some((entry) => entry.isIntersecting)) return;
      played = true;
      observer.disconnect();
      if (!preference.matches) cancel = play();
    },
    { threshold: 0.08 },
  );
  const stop = () => {
    played = true;
    observer.disconnect();
    cancel?.();
  };
  const onPreference = () => {
    if (preference.matches) stop();
  };
  preference.addEventListener('change', onPreference);
  observer.observe(element);
  return () => {
    stop();
    preference.removeEventListener('change', onPreference);
  };
}

export function entranceTiming(element: HTMLElement): KeyframeAnimationOptions {
  const style = element.ownerDocument.defaultView?.getComputedStyle(element);
  return {
    duration: parseFloat(style?.getPropertyValue('--motion-duration') || '') || 480,
    easing: style?.getPropertyValue('--ease-out').trim() || 'cubic-bezier(0.23, 1, 0.32, 1)',
  };
}
