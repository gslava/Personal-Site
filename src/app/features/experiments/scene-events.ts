/** Wall-clock vignettes advance only while the scene is visible and playing. */
export class SceneEvents {
  kind = 0;
  phase = 0;
  private elapsed = 0;
  private next: number;
  private last = 0;

  constructor(private readonly random: () => number = Math.random) {
    this.next = 8 + random() * 4;
  }

  advance(seconds: number): void {
    this.elapsed += Math.max(0, seconds);
    if (this.elapsed >= this.next) {
      // Avoid immediately repeating the same vignette.
      this.kind = ((this.last + 1 + Math.floor(this.random() * 4) - 1) % 5) + 1;
      this.last = this.kind;
      this.phase = 0;
      this.elapsed %= this.next;
      this.next = 8 + this.random() * 4;
    } else if (this.kind) {
      this.phase += Math.max(0, seconds);
      if (this.phase >= 5) this.kind = 0;
    }
  }
}
