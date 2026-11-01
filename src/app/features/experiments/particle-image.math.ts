export interface TrailMark {
  x: number;
  y: number;
  age: number;
  strength: number;
}
export const TRAIL_LIFETIME = 1.5;
export const MAX_TRAIL_MARKS = 96;

export function trailEnvelope(age: number): number {
  if (age < 0 || age >= TRAIL_LIFETIME) return 0;
  const attack = Math.min(1, age / 0.15);
  const decay = 1 - age / TRAIL_LIFETIME;
  return attack * decay * decay;
}

export function ageTrail(marks: TrailMark[], seconds: number): TrailMark[] {
  return marks
    .map((mark) => ({ ...mark, age: mark.age + Math.max(0, seconds) }))
    .filter((mark) => mark.age < TRAIL_LIFETIME)
    .slice(-MAX_TRAIL_MARKS);
}

export function imageCoordinates(
  x: number,
  y: number,
  bounds: { left: number; top: number; width: number; height: number },
): { x: number; y: number } | null {
  const side = Math.min(bounds.width, bounds.height) * 0.86;
  if (side <= 0) return null;
  const u = (x - bounds.left - (bounds.width - side) / 2) / side;
  const v = 1 - (y - bounds.top - (bounds.height - side) / 2) / side;
  return u < 0 || u > 1 || v < 0 || v > 1 ? null : { x: u, y: v };
}

export function sampleParticleImage(pixels: Uint8ClampedArray, width: number, height: number) {
  const centers: number[] = [];
  const tones: number[] = [];
  const seeds: number[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const brightness =
        ((pixels[offset] * 0.2126 + pixels[offset + 1] * 0.7152 + pixels[offset + 2] * 0.0722) /
          255) *
        (pixels[offset + 3] / 255);
      if (brightness < 0.075) continue;
      centers.push(((x + 0.5) / width) * 2 - 1, 1 - ((y + 0.5) / height) * 2);
      tones.push(brightness);
      const hash = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
      seeds.push(hash - Math.floor(hash));
    }
  }
  return {
    centers: new Float32Array(centers),
    tones: new Float32Array(tones),
    seeds: new Float32Array(seeds),
  };
}
