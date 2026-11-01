import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PortfolioContentService } from '../../core/content/portfolio-content';
import { RenderQuality } from './visual-quality';
import { VisualRenderer } from './visual-renderer';
import { VisualScene } from './visual-shaders';

@Component({
  selector: 'app-visual-page',
  imports: [RouterLink],
  templateUrl: './visual-page.component.html',
  styleUrl: './visual-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualPageComponent {
  protected readonly t = inject(PortfolioContentService).text;
  private readonly slug = inject(ActivatedRoute).snapshot.data['scene'] as VisualScene;
  protected readonly cinematic = this.t.cinematicExperiments.find(
    (scene) => scene.slug === this.slug,
  );
  protected readonly scene = this.cinematic!;
  protected readonly earth = this.slug === 'abyssal-bloom';
  protected readonly palettes = this.cinematic!.palettes;
  protected readonly others = this.t.cinematicExperiments.filter(
    (scene) => scene.slug !== this.slug,
  );
  protected readonly satelliteCount = signal(12);
  protected readonly orbitalDistance = signal(1);
  protected readonly playing = signal(false);
  protected readonly unavailable = signal(false);
  protected readonly speed = signal(1);
  protected readonly intensity = signal(1);
  protected readonly palette = signal(0);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly zone = inject(NgZone);
  private renderer?: VisualRenderer;
  private visible = true;
  protected readonly immersive = signal(false);
  protected readonly camera = signal(0);
  protected readonly quality = signal<RenderQuality>('auto');
  private previousFocus?: HTMLElement;
  private previousOverflow?: string;

  constructor() {
    const destroy = inject(DestroyRef);
    destroy.onDestroy(() => this.leaveCinema(false));
    afterNextRender(() => {
      const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
      this.playing.set(!reducedMotion.matches);
      this.initialize();
      const observer = new ResizeObserver(() => this.safeResize());
      observer.observe(this.canvas().nativeElement);
      const intersection = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.syncAnimation();
      });
      intersection.observe(this.canvas().nativeElement);
      const visibility = () => this.syncAnimation();
      const motionChange = () => {
        if (reducedMotion.matches) {
          this.playing.set(false);
          this.syncAnimation();
        }
      };
      document.addEventListener('visibilitychange', visibility);
      reducedMotion.addEventListener('change', motionChange);
      destroy.onDestroy(() => {
        observer.disconnect();
        intersection.disconnect();
        document.removeEventListener('visibilitychange', visibility);
        reducedMotion.removeEventListener('change', motionChange);
        this.renderer?.dispose();
      });
    });
  }

  protected initialize(): void {
    this.renderer?.dispose();
    this.renderer = undefined;
    try {
      this.renderer = new VisualRenderer(this.canvas().nativeElement, this.slug, () =>
        this.renderFailed(),
      );
      this.renderer.setQuality(this.quality());
      this.applySettings();
      this.unavailable.set(false);
      this.syncAnimation();
    } catch {
      this.unavailable.set(true);
    }
  }

  protected contextLost(event: Event): void {
    event.preventDefault();
    this.renderer?.dispose();
    this.renderer = undefined;
    this.unavailable.set(true);
  }

  protected toggle(): void {
    this.playing.update((value) => !value);
    this.syncAnimation();
  }

  private syncAnimation(): void {
    this.zone.runOutsideAngular(() =>
      this.renderer?.setActive(this.playing() && !document.hidden && this.visible),
    );
  }

  protected change(
    event: Event,
    setting: 'speed' | 'intensity' | 'palette' | 'satelliteCount' | 'orbitalDistance',
  ): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(value)) return;
    this[setting].set(value);
    this.applySettings();
  }

  private applySettings(): void {
    if (!this.renderer) return;
    this.renderer.satelliteCount = this.satelliteCount();
    this.renderer.orbitalDistance = this.orbitalDistance();
    this.renderer.speed = this.speed();
    this.renderer.intensity = this.intensity();
    this.renderer.palette = this.palette();
    this.renderer.camera = this.camera();
    this.renderer.draw();
  }

  protected reset(): void {
    this.satelliteCount.set(12);
    this.orbitalDistance.set(1);
    this.speed.set(1);
    this.intensity.set(1);
    this.palette.set(0);
    this.camera.set(0);
    this.applySettings();
    this.renderer?.reset();
  }

  protected chooseCamera(index: number): void {
    this.camera.set(index);
    if (this.renderer) this.renderer.pointer = { x: 0, y: 0 };
    this.applySettings();
  }

  protected cyclePalette(): void {
    this.palette.update((value) => (value + 1) % this.palettes.length);
    this.applySettings();
  }

  protected changeQuality(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as RenderQuality;
    if (!['auto', 'performance', 'high'].includes(value)) return;
    this.quality.set(value);
    try {
      this.renderer?.setQuality(value);
    } catch {
      this.renderFailed();
    }
  }

  private renderFailed(): void {
    this.renderer?.dispose();
    this.renderer = undefined;
    this.unavailable.set(true);
  }

  private safeResize(): void {
    try {
      this.renderer?.resize();
    } catch {
      this.renderFailed();
    }
  }

  protected enterCinema(): void {
    this.previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
    this.previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    this.immersive.set(true);
    this.canvas().nativeElement.focus({ preventScroll: true });
  }

  protected leaveCinema(restoreFocus = true): void {
    if (this.previousOverflow !== undefined) {
      document.body.style.overflow = this.previousOverflow;
      this.previousOverflow = undefined;
    }
    this.immersive.set(false);
    if (restoreFocus && this.previousFocus?.isConnected)
      this.previousFocus.focus({ preventScroll: true });
  }

  protected stageKeyboard(event: KeyboardEvent): void {
    if (!this.immersive()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.leaveCinema();
      return;
    }
    if (event.key !== 'Tab') return;
    const stage = this.canvas().nativeElement.parentElement!;
    const focusable = Array.from(
      stage.querySelectorAll<HTMLElement>('canvas, button:not(:disabled)'),
    ).filter((element) => getComputedStyle(element).visibility !== 'hidden');
    const index = focusable.indexOf(document.activeElement as HTMLElement);
    const next = event.shiftKey
      ? (index - 1 + focusable.length) % focusable.length
      : (index + 1) % focusable.length;
    event.preventDefault();
    focusable[next]?.focus();
  }

  protected move(event: PointerEvent): void {
    if (!this.renderer) return;
    const rect = this.canvas().nativeElement.getBoundingClientRect();
    this.renderer.pointer = {
      x: Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width) * 2 - 1)),
      y: Math.max(-1, Math.min(1, 1 - ((event.clientY - rect.top) / rect.height) * 2)),
    };
    if (!this.playing()) this.renderer.draw();
  }

  protected keyboard(event: KeyboardEvent): void {
    const direction: Record<string, [number, number]> = {
      ArrowLeft: [-0.1, 0],
      ArrowRight: [0.1, 0],
      ArrowUp: [0, 0.1],
      ArrowDown: [0, -0.1],
    };
    const delta = direction[event.key];
    if (event.code === 'Space' && this.renderer) {
      event.preventDefault();
      this.toggle();
      return;
    }
    if (!delta || !this.renderer) return;
    event.preventDefault();
    const p = this.renderer.pointer;
    this.renderer.pointer = {
      x: Math.max(-1, Math.min(1, p.x + delta[0])),
      y: Math.max(-1, Math.min(1, p.y + delta[1])),
    };
    this.renderer.draw();
  }
}
