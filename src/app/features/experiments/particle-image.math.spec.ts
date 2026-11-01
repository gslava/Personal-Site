import {
  ageTrail,
  imageCoordinates,
  MAX_TRAIL_MARKS,
  sampleParticleImage,
  TRAIL_LIFETIME,
  trailEnvelope,
} from './particle-image.math';

describe('image particle sampling and interaction', () => {
  it('drops dark/transparent pixels, retains luminance and flips image Y into scene coordinates', () => {
    const pixels = new Uint8ClampedArray([
      255, 255, 255, 255, 0, 0, 0, 255, 255, 255, 255, 0, 255, 0, 0, 255,
    ]);
    const data = sampleParticleImage(pixels, 2, 2);
    expect(Array.from(data.centers)).toEqual([-0.5, 0.5, 0.5, -0.5]);
    expect(data.tones[0]).toBe(1);
    expect(data.tones[1]).toBeCloseTo(0.2126);
  });
  it('grows a touch then fully releases the image after its lifetime', () => {
    expect(trailEnvelope(0)).toBe(0);
    expect(trailEnvelope(0.15)).toBeGreaterThan(trailEnvelope(0.01));
    expect(trailEnvelope(0.7)).toBeGreaterThan(trailEnvelope(1.4));
    expect(trailEnvelope(TRAIL_LIFETIME)).toBe(0);
    expect(ageTrail([{ x: 0.5, y: 0.5, age: 0, strength: 1 }], TRAIL_LIFETIME)).toEqual([]);
  });
  it('bounds retained input history and ages it independently of frame rate', () => {
    const marks = Array.from({ length: 200 }, (_, i) => ({
      x: i / 200,
      y: 0.5,
      age: 0,
      strength: 1,
    }));
    expect(ageTrail(marks, 0.1)).toHaveLength(MAX_TRAIL_MARKS);
    let stepped = marks.slice(-1);
    for (let i = 0; i < 10; i++) stepped = ageTrail(stepped, 0.05);
    expect(stepped[0].age).toBeCloseTo(ageTrail(marks.slice(-1), 0.5)[0].age);
  });
  it('maps the fitted image instead of stretching input across letterboxing', () => {
    const bounds = { left: 100, top: 50, width: 1000, height: 500 };
    expect(imageCoordinates(600, 300, bounds)).toEqual({ x: 0.5, y: 0.5 });
    expect(imageCoordinates(110, 300, bounds)).toBeNull();
    expect(imageCoordinates(600, 90, bounds)?.y).toBeGreaterThan(0.9);
    expect(imageCoordinates(0, 0, { left: 0, top: 0, width: 0, height: 0 })).toBeNull();
  });
});
