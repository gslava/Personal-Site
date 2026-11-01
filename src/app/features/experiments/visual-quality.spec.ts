import { describe, expect, it } from 'vitest';
import { AdaptiveResolution, drawingSize } from './visual-quality';

describe('GPU workload limits', () => {
  it('bounds Retina fullscreen allocations and preserves portrait and landscape ratios', () => {
    for (const [width, height] of [
      [7680, 4320],
      [1440, 3200],
    ]) {
      const [w, h] = drawingSize(width, height, 3, 'high');
      expect(w).toBeLessThanOrEqual(1600);
      expect(h).toBeLessThanOrEqual(1000);
      expect(w / h).toBeCloseTo(width / height, 2);
      const [lowW, lowH] = drawingSize(width, height, 3, 'performance');
      expect(lowW * lowH).toBeLessThan(w * h * 0.5);
    }
    expect(drawingSize(0, 0, 1, 'auto')).toEqual([1, 1]);
  });

  it('ignores transient stalls and steadily reduces sustained slow rendering without collapsing resolution', () => {
    const controller = new AdaptiveResolution();
    controller.observe(150);
    for (let i = 0; i < 100; i++) controller.observe(34);
    expect(controller.scale).toBe(1);
    for (let i = 0; i < 20; i++) controller.observe(90);
    expect(controller.scale).toBeLessThan(1);
    for (let i = 0; i < 200; i++) controller.observe(90);
    expect(controller.scale).toBe(0.5);
    controller.reset();
    expect(controller.scale).toBe(1);
  });
});
