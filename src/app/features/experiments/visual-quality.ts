export type RenderQuality = 'auto' | 'performance' | 'high';

/** Caps pixel work independently of CSS/fullscreen size, including Retina screens. */
export function drawingSize(
  width: number,
  height: number,
  dpr: number,
  quality: RenderQuality,
  autoScale = 1,
): [number, number] {
  const scale = quality === 'performance' ? 0.65 : quality === 'auto' ? autoScale : 1;
  const maxWidth = quality === 'high' ? 1600 : 1100;
  const maxHeight = quality === 'high' ? 1000 : 720;
  const ratio =
    Math.min(
      Math.max(1, dpr),
      1.5,
      maxWidth / Math.max(1, width),
      maxHeight / Math.max(1, height),
    ) * scale;
  return [Math.max(1, Math.round(width * ratio)), Math.max(1, Math.round(height * ratio))];
}

/** Use several slow frames before reducing resolution; a single hitch isn't evidence. */
export class AdaptiveResolution {
  private slowFrames = 0;
  scale = 1;
  observe(frameMs: number): boolean {
    this.slowFrames =
      frameMs > 55 ? this.slowFrames + (frameMs > 120 ? 3 : 1) : Math.max(0, this.slowFrames - 1);
    if (this.slowFrames < 20 || this.scale <= 0.5) return false;
    this.scale = Math.max(0.5, this.scale - 0.15);
    this.slowFrames = 0;
    return true;
  }
  reset(): void {
    this.slowFrames = 0;
    this.scale = 1;
  }
}
