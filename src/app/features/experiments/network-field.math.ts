export type NetworkKind = 'neural' | 'services';
export type Point = { x: number; y: number };
export type NetworkSeed = Point & { phase: number; cluster: number; relay: boolean };
export type Pulse = Point & { born: number };
const tau = Math.PI * 2;
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export function networkCount(density: number, width: number): number {
  return Math.round(clamp(density, 0, 2)) * (width < 600 ? 100 : 180) + (width < 600 ? 260 : 480);
}

export function networkSeeds(kind: NetworkKind, count: number): NetworkSeed[] {
  let state = 7411;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  return Array.from({ length: count }, (_, i) => {
    const cluster = i % 7;
    const phase = random() * tau;
    if (kind === 'neural') {
      const angle = random() * tau;
      const radius = Math.sqrt(random());
      const lobe = i % 2 ? 1 : -1;
      const ripple = 1 + 0.12 * Math.sin(angle * 5);
      return {
        x: 0.5 + lobe * 0.115 + Math.cos(angle) * radius * 0.235 * ripple,
        y: 0.5 + Math.sin(angle) * radius * 0.355 * ripple,
        phase,
        cluster,
        relay: false,
      };
    }
    const relay = i >= count * 0.72;
    const angle = (cluster * tau) / 7 - Math.PI / 2;
    const radius = Math.sqrt(random()) * 0.082;
    return {
      x: 0.5 + Math.cos(angle) * 0.3 + Math.cos(phase) * radius,
      y: 0.5 + Math.sin(angle) * 0.31 + Math.sin(phase) * radius,
      phase,
      cluster,
      relay,
    };
  });
}

// Normalized coordinates make deformation independent of canvas resolution and DPR.
export function fieldPosition(
  seed: NetworkSeed,
  kind: NetworkKind,
  time: number,
  pointer: Point | undefined,
  strength: number,
  pulses: readonly Pulse[],
  aspect: number,
): Point & { energy: number } {
  let x = seed.x,
    y = seed.y;
  if (kind === 'neural') {
    x += Math.sin(time * 0.32 + seed.y * 12 + seed.phase) * 0.013;
    y += Math.cos(time * 0.27 + seed.x * 10 + seed.phase) * 0.013;
    const rotation = Math.sin(time * 0.18) * 0.055;
    const dx = x - 0.5,
      dy = y - 0.5;
    x = 0.5 + dx * Math.cos(rotation) - dy * Math.sin(rotation);
    y = 0.5 + dx * Math.sin(rotation) + dy * Math.cos(rotation);
  } else if (seed.relay) {
    const from = (seed.cluster * tau) / 7 - Math.PI / 2;
    const to = ((seed.cluster + 2) * tau) / 7 - Math.PI / 2;
    const travel = (seed.phase / tau + time * 0.065) % 1;
    const bend = Math.sin(travel * Math.PI) * 0.065;
    x = 0.5 + (Math.cos(from) * (1 - travel) + Math.cos(to) * travel) * 0.3 + bend;
    y = 0.5 + (Math.sin(from) * (1 - travel) + Math.sin(to) * travel) * 0.31 - bend;
  } else {
    const angle = (seed.cluster * tau) / 7 - Math.PI / 2;
    const cx = 0.5 + Math.cos(angle) * 0.3,
      cy = 0.5 + Math.sin(angle) * 0.31;
    const rotation = time * (seed.cluster % 2 ? 0.16 : -0.16);
    const dx = seed.x - cx,
      dy = seed.y - cy;
    x = cx + dx * Math.cos(rotation) - dy * Math.sin(rotation);
    y = cy + dx * Math.sin(rotation) + dy * Math.cos(rotation);
  }
  let energy = 0;
  if (pointer) {
    const dx = pointer.x - x,
      dy = pointer.y - y;
    const distance = Math.hypot(dx * aspect, dy);
    const influence = Math.exp((-distance * distance) / 0.025) * clamp(strength, 0, 2);
    energy = influence;
    if (kind === 'neural') {
      x += dx * influence * 0.28;
      y += dy * influence * 0.28;
    } else {
      x += (-dx - (dy / aspect) * 0.65) * influence * 0.3;
      y += (-dy + dx * aspect * 0.65) * influence * 0.3;
    }
  }
  for (const pulse of pulses) {
    const age = time - pulse.born;
    if (age < 0 || age > 2.4) continue;
    const dx = x - pulse.x,
      dy = y - pulse.y;
    const distance = Math.hypot(dx * aspect, dy);
    const wave = Math.exp(-Math.pow((distance - age * 0.32) / 0.065, 2)) * (1 - age / 2.4);
    const force = (wave * 0.045 * clamp(strength, 0, 2)) / Math.max(distance, 0.02);
    x += dx * force;
    y += dy * force;
    energy += wave;
  }
  return { x: clamp(x, 0.025, 0.975), y: clamp(y, 0.025, 0.975), energy: clamp(energy, 0, 1.7) };
}

export function networkPoint(
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
): Point | undefined {
  if (!rect.width || !rect.height) return undefined;
  return {
    x: clamp((clientX - rect.left) / rect.width, 0, 1),
    y: clamp((clientY - rect.top) / rect.height, 0, 1),
  };
}
