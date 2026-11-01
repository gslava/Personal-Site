import { fieldPosition, networkCount, networkPoint, networkSeeds } from './network-field.math';

describe('abstract network fields', () => {
  it('keeps density bounded and adapts particle counts to mobile', () => {
    expect(networkCount(1, 1200)).toBe(660);
    expect(networkCount(1, 390)).toBe(360);
    expect(networkCount(100, 1200)).toBe(840);
    expect(networkCount(-10, 390)).toBe(260);
  });
  it('creates reproducible, distinct structures with relay paths only in services', () => {
    const neural = networkSeeds('neural', 660);
    expect(neural).toEqual(networkSeeds('neural', 660));
    expect(neural.every((seed) => !seed.relay)).toBe(true);
    const services = networkSeeds('services', 660);
    expect(services.filter((seed) => seed.relay).length).toBeGreaterThan(180);
    expect(new Set(services.map((seed) => seed.cluster)).size).toBe(7);
    expect(services).not.toEqual(neural);
  });
  it('pulls neural points toward attention and pushes service points away', () => {
    const pointer = { x: 0.58, y: 0.5 };
    for (const kind of ['neural', 'services'] as const) {
      const seed = networkSeeds(kind, 660).find((seed) => !seed.relay)!;
      const base = fieldPosition(seed, kind, 0, undefined, 1, [], 1.6);
      const nearby = { x: base.x + 0.025, y: base.y + 0.025 };
      const active = fieldPosition(seed, kind, 0, nearby, 1, [], 1.6);
      const before = Math.hypot((base.x - nearby.x) * 1.6, base.y - nearby.y);
      const after = Math.hypot((active.x - nearby.x) * 1.6, active.y - nearby.y);
      expect(kind === 'neural' ? after < before : after > before).toBe(true);
      expect(active.energy).toBeGreaterThan(0);
      expect(fieldPosition(seed, kind, 0, pointer, 0, [], 1.6)).toEqual(base);
    }
  });
  it('propagates a bounded wave and stops applying it after its lifetime', () => {
    const seed = { x: 0.66, y: 0.5, phase: 0, cluster: 0, relay: false };
    const pulse = { x: 0.5, y: 0.5, born: 0 };
    const active = fieldPosition(seed, 'neural', 0.8, undefined, 1, [pulse], 1.6);
    const base = fieldPosition(seed, 'neural', 0.8, undefined, 1, [], 1.6);
    expect(active.energy).toBeGreaterThan(0.4);
    expect(active.x).toBeGreaterThan(base.x);
    expect(fieldPosition(seed, 'neural', 3, undefined, 1, [pulse], 1.6)).toEqual(
      fieldPosition(seed, 'neural', 3, undefined, 1, [], 1.6),
    );
  });
  it('maps cursor coordinates independently of resolution and safely handles empty canvases', () => {
    expect(networkPoint(160, 90, { left: 10, top: 15, width: 300, height: 150 })).toEqual({
      x: 0.5,
      y: 0.5,
    });
    expect(networkPoint(-50, 500, { left: 0, top: 0, width: 100, height: 100 })).toEqual({
      x: 0,
      y: 1,
    });
    expect(networkPoint(0, 0, { left: 0, top: 0, width: 0, height: 0 })).toBeUndefined();
  });
  it('keeps long-running fields and strong impulses inside the stage', () => {
    for (const kind of ['neural', 'services'] as const)
      for (const seed of networkSeeds(kind, 100)) {
        const point = fieldPosition(
          seed,
          kind,
          7200,
          { x: 0.2, y: 0.8 },
          2,
          [{ x: 0, y: 0, born: 7199 }],
          0.7,
        );
        expect(Number.isFinite(point.x + point.y)).toBe(true);
        expect(point.x).toBeGreaterThanOrEqual(0.025);
        expect(point.x).toBeLessThanOrEqual(0.975);
        expect(point.y).toBeGreaterThanOrEqual(0.025);
        expect(point.y).toBeLessThanOrEqual(0.975);
      }
  });
});
