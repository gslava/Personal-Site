import { describe, expect, it } from 'vitest';
import { SceneEvents } from './scene-events';

describe('scene vignettes', () => {
  it('starts at the sampled interval, expires and avoids consecutive duplicates', () => {
    const events = new SceneEvents(() => 0.5);
    events.advance(9.9);
    expect(events.kind).toBe(0);
    events.advance(0.1);
    const first = events.kind;
    expect(first).toBeGreaterThan(0);
    events.advance(4);
    expect(events.phase).toBe(4);
    events.advance(1);
    expect(events.kind).toBe(0);
    events.advance(5);
    expect(events.kind).not.toBe(first);
    expect(events.kind).toBeGreaterThan(0);
  });
});
