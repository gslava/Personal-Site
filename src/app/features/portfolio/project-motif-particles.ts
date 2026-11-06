import { constellation, constellationLinks } from './project-motif-particles.data';

interface Point {
  x: number;
  y: number;
}

/** Small decorative canvas: no WebGL, framework updates or site-wide pointer listeners. */
export function attachMotifParticles(host: HTMLElement, variant: string): () => void {
  const canvas = host.querySelector<HTMLCanvasElement>('canvas');
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return () => undefined;
  const field = variant === 'work-overview';
  const trigger = host.closest<HTMLElement>('.project-row, .work-portal__link') ?? host;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const events = new AbortController();
  const dots = constellation.map((point) => ({ ...point, vx: 0, vy: 0 }));
  const paths = [...host.querySelectorAll<SVGPathElement>('.motif__flow-guides path')].map(
    (path) => {
      const length = path.getTotalLength();
      const count = Math.max(2, Math.ceil(length / 3));
      return Array.from({ length: count + 1 }, (_, i) =>
        path.getPointAtLength((i / count) * length),
      );
    },
  );
  const accent = getComputedStyle(host).getPropertyValue('--accent').trim() || '#e4a071';
  let visible = false;
  let hovered = false;
  let focused = false;
  let previewed = false;
  let previewUntil = 0;
  let settleUntil = 0;
  let pulseAt = -Infinity;
  let pointer: Point | undefined;
  let frame = 0;
  let previous = 0;
  let disposed = false;

  function allowed(): boolean {
    return !disposed && visible && !document.hidden && !motion.matches && fine.matches;
  }

  function active(now: number): boolean {
    return hovered || focused || now < previewUntil || now < settleUntil;
  }

  function stop(): void {
    cancelAnimationFrame(frame);
    frame = 0;
    previous = 0;
    host.removeAttribute('data-particles-active');
    // Resume from the same static composition after scrolling or switching tabs.
    dots.forEach((dot, i) => Object.assign(dot, constellation[i], { vx: 0, vy: 0 }));
  }

  function sync(): void {
    if (allowed() && active(performance.now())) {
      if (!frame) frame = requestAnimationFrame(draw);
    } else {
      stop();
    }
  }

  function resize(): void {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas!.width = Math.max(1, Math.round(canvas!.clientWidth * ratio));
    canvas!.height = Math.max(1, Math.round(canvas!.clientHeight * ratio));
    context!.setTransform(canvas!.width / 360, 0, 0, canvas!.height / 220, 0, 0);
  }

  function circle(x: number, y: number, radius: number, opacity: number): void {
    context!.globalAlpha = opacity;
    context!.beginPath();
    context!.arc(x, y, radius, 0, Math.PI * 2);
    context!.fill();
  }

  function drawField(now: number, dt: number): void {
    const pulse = (now - pulseAt) / 1100;
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      const base = constellation[i];
      let x = base.x + Math.sin(now / 1800 + i * 1.7) * 1.6;
      let y = base.y + Math.cos(now / 2100 + i * 0.8) * 1.6;
      if (pointer) {
        const dx = base.x - pointer.x;
        const dy = base.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 65) {
          const force = (1 - distance / 65) * 28;
          x += (dx / (distance || 1)) * force;
          y += (dy / (distance || 1)) * force;
        }
      }
      if (pulse > 0 && pulse < 1) {
        const dx = base.x - 181;
        const dy = base.y - 100;
        const distance = Math.hypot(dx, dy);
        const wave = Math.max(0, 1 - Math.abs(distance - pulse * 220) / 24) * 5;
        x += (dx / (distance || 1)) * wave;
        y += (dy / (distance || 1)) * wave;
      }
      // Spring: mass 1, stiffness 100, damping 10. Velocity survives pointer changes.
      dot.vx = (dot.vx + (x - dot.x) * 100 * dt) * Math.exp(-10 * dt);
      dot.vy = (dot.vy + (y - dot.y) * 100 * dt) * Math.exp(-10 * dt);
      dot.x += dot.vx * dt;
      dot.y += dot.vy * dt;
    }
    context!.lineWidth = 0.65;
    for (const link of constellationLinks) {
      const from = dots[link.from];
      const to = dots[link.to];
      const bridge = link.from < 3 && link.to < 3;
      context!.globalAlpha = bridge ? 0.3 : 0.18;
      context!.beginPath();
      context!.moveTo(from.x, from.y);
      context!.lineTo(to.x, to.y);
      context!.stroke();
      if (bridge && pulse > 0 && pulse < 1) {
        circle(from.x + (to.x - from.x) * pulse, from.y + (to.y - from.y) * pulse, 2, 0.95);
      }
    }
    dots.forEach((dot, i) => {
      if (i < 3) {
        circle(dot.x, dot.y, dot.radius * 3, 0.07);
        context!.globalAlpha = 0.45;
        context!.lineWidth = 0.8;
        context!.beginPath();
        context!.arc(dot.x, dot.y, [12, 14, 12][i], 0, Math.PI * 2);
        context!.stroke();
      }
      circle(dot.x, dot.y, dot.radius, i < 3 ? 1 : 0.8);
    });
  }

  function drawFlows(now: number): void {
    const opacity = Math.min(1, (settleUntil - now) / 450);
    const fading = !hovered && !focused;
    paths.forEach((path, i) => {
      // Two small packets per route, each with a short fading tail.
      for (let packet = 0; packet < 2; packet++) {
        const progress = (now / (3000 + i * 260) + i * 0.19 + packet * 0.5) % 1;
        for (let tail = 4; tail >= 0; tail--) {
          const position = Math.max(0, progress - tail * 0.015) * (path.length - 1);
          const index = Math.floor(position);
          const a = path[index];
          const b = path[Math.min(index + 1, path.length - 1)];
          const fraction = position - index;
          circle(
            a.x + (b.x - a.x) * fraction,
            a.y + (b.y - a.y) * fraction,
            tail === 0 ? 2.2 : 1.4,
            (tail === 0 ? 1 : 0.24 - tail * 0.04) * (fading ? Math.max(0, opacity) : 1),
          );
        }
      }
    });
  }

  function draw(now: number): void {
    frame = 0;
    if (!allowed() || !active(now)) {
      stop();
      return;
    }
    const dt = previous ? Math.min((now - previous) / 1000, 0.032) : 1 / 60;
    previous = now;
    context!.clearRect(0, 0, 360, 220);
    context!.fillStyle = accent;
    context!.strokeStyle = accent;
    if (field) drawField(now, dt);
    else drawFlows(now);
    host.setAttribute('data-particles-active', '');
    frame = requestAnimationFrame(draw);
  }

  function leave(): void {
    hovered = false;
    pointer = undefined;
    settleUntil = performance.now() + 650;
    sync();
  }

  trigger.addEventListener(
    'pointerenter',
    () => {
      if (!fine.matches) return;
      hovered = true;
      pulseAt = performance.now();
      sync();
    },
    { signal: events.signal },
  );
  trigger.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerType === 'touch' || !fine.matches) return;
      const rect = canvas.getBoundingClientRect();
      pointer = {
        x: ((event.clientX - rect.left) / rect.width) * 360,
        y: ((event.clientY - rect.top) / rect.height) * 220,
      };
    },
    { signal: events.signal, passive: true },
  );
  trigger.addEventListener('pointerleave', leave, { signal: events.signal });
  trigger.addEventListener('pointercancel', leave, { signal: events.signal });
  trigger.addEventListener(
    'focusin',
    () => {
      focused = true;
      pulseAt = performance.now();
      sync();
    },
    { signal: events.signal },
  );
  trigger.addEventListener(
    'focusout',
    (event) => {
      if (event.relatedTarget instanceof Node && trigger.contains(event.relatedTarget)) return;
      focused = false;
      settleUntil = performance.now() + 650;
      sync();
    },
    { signal: events.signal },
  );
  document.addEventListener('visibilitychange', sync, { signal: events.signal });
  const onPreference = () => {
    hovered = false;
    focused = trigger.contains(document.activeElement);
    pointer = undefined;
    previewUntil = 0;
    settleUntil = 0;
    sync();
  };
  motion.addEventListener('change', onPreference);
  fine.addEventListener('change', onPreference);
  const intersection = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (field && visible && allowed() && !previewed) {
        previewed = true;
        pulseAt = performance.now();
        previewUntil = pulseAt + 3800;
      }
      if (!visible) {
        hovered = false;
        pointer = undefined;
      }
      sync();
    },
    { threshold: 0.15 },
  );
  const size = new ResizeObserver(resize);
  resize();
  size.observe(canvas);
  intersection.observe(host);
  return () => {
    disposed = true;
    stop();
    events.abort();
    intersection.disconnect();
    size.disconnect();
    motion.removeEventListener('change', onPreference);
    fine.removeEventListener('change', onPreference);
  };
}
