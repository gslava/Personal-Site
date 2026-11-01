import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  NgZone,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortfolioContentService } from '../../core/content/portfolio-content';
import { imageCoordinates } from './particle-image.math';
import type { ParticleImageRenderer } from './particle-image-renderer';

@Component({
  selector: 'app-particle-image-page',
  imports: [RouterLink],
  templateUrl: './particle-image-page.component.html',
  styleUrl: './particle-image-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticleImagePageComponent {
  protected readonly t = inject(PortfolioContentService).text;
  protected readonly selected = signal(0);
  protected readonly status = signal<'loading' | 'ready' | 'fallback'>('loading');
  protected readonly sources = ['fox', 'owl', 'jellyfish'];
  protected readonly imagePath = computed(
    () => 'images/particle-images/' + this.sources[this.selected()] + '.png',
  );
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly zone = inject(NgZone);
  private renderer?: ParticleImageRenderer;
  private destroyed = false;
  private request = 0;
  private reducedMotion = false;
  private visible = true;
  private keyboardPoint = { x: 0.5, y: 0.5 };

  constructor() {
    const destroy = inject(DestroyRef);
    destroy.onDestroy(() => {
      this.destroyed = true;
      this.request++;
      this.renderer?.dispose();
    });
    afterNextRender(() => {
      const canvas = this.canvas().nativeElement;
      const motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.reducedMotion = motion.matches;
      const onMotion = () => {
        this.reducedMotion = motion.matches;
        this.renderer?.setReducedMotion(motion.matches);
      };
      const resize = new ResizeObserver(() => this.renderer?.resize());
      resize.observe(canvas);
      const observer = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.syncActivity();
      });
      observer.observe(canvas);
      const onVisibility = () => this.syncActivity();
      document.addEventListener('visibilitychange', onVisibility);
      motion.addEventListener('change', onMotion);
      destroy.onDestroy(() => {
        resize.disconnect();
        observer.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        motion.removeEventListener('change', onMotion);
      });
      void this.selectImage(0);
    });
  }

  protected async selectImage(index: number): Promise<void> {
    if (!Number.isInteger(index) || index < 0 || index >= this.sources.length) return;
    const request = ++this.request;
    this.selected.set(index);
    this.status.set('loading');
    this.renderer?.setActive(false);
    try {
      const image = new Image();
      image.src = new URL(this.imagePath(), document.baseURI).href;
      await image.decode();
      const { ParticleImageRenderer } = await import('./particle-image-renderer');
      if (this.destroyed || request !== this.request) return;
      this.zone.runOutsideAngular(() => {
        this.renderer ??= new ParticleImageRenderer(
          this.canvas().nativeElement,
          this.reducedMotion,
        );
        this.renderer.setImage(image);
        this.syncActivity();
      });
      this.status.set('ready');
    } catch {
      if (this.destroyed || request !== this.request) return;
      this.renderer?.dispose();
      this.renderer = undefined;
      this.status.set('fallback');
    }
  }

  private syncActivity(): void {
    this.zone.runOutsideAngular(() => this.renderer?.setActive(this.visible && !document.hidden));
  }

  protected pointer(event: PointerEvent): void {
    if (this.status() !== 'ready') return;
    if (event.type === 'pointerdown') {
      this.canvas().nativeElement.setPointerCapture(event.pointerId);
      this.canvas().nativeElement.focus({ preventScroll: true });
    }
    const point = imageCoordinates(
      event.clientX,
      event.clientY,
      this.canvas().nativeElement.getBoundingClientRect(),
    );
    this.zone.runOutsideAngular(() => {
      if (point) this.renderer?.interact(point);
      else this.renderer?.endInteraction();
    });
  }

  protected endInteraction(): void {
    this.zone.runOutsideAngular(() => this.renderer?.endInteraction());
  }

  protected keyboard(event: KeyboardEvent): void {
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-0.04, 0],
      ArrowRight: [0.04, 0],
      ArrowUp: [0, 0.04],
      ArrowDown: [0, -0.04],
    };
    const move = moves[event.key];
    if (!move || this.status() !== 'ready') return;
    event.preventDefault();
    this.keyboardPoint = {
      x: Math.max(0, Math.min(1, this.keyboardPoint.x + move[0])),
      y: Math.max(0, Math.min(1, this.keyboardPoint.y + move[1])),
    };
    this.zone.runOutsideAngular(() => this.renderer?.interact(this.keyboardPoint));
  }

  protected contextLost(event: Event): void {
    event.preventDefault();
    this.request++;
    this.renderer?.dispose();
    this.renderer = undefined;
    this.status.set('fallback');
  }
}
