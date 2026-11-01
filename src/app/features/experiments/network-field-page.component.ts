import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  InjectionToken,
  NgZone,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PortfolioContentService } from '../../core/content/portfolio-content';
import { networkPoint, type NetworkKind, type Point } from './network-field.math';
import type { NetworkFieldRenderer } from './network-field-renderer';

type NetworkFieldRuntime = Pick<
  NetworkFieldRenderer,
  'setRunning' | 'setStrength' | 'interact' | 'endInteraction' | 'pulse' | 'resize' | 'dispose'
>;
export const NETWORK_FIELD_FACTORY = new InjectionToken<
  (canvas: HTMLCanvasElement, kind: NetworkKind, density: number) => Promise<NetworkFieldRuntime>
>('NETWORK_FIELD_FACTORY', {
  providedIn: 'root',
  factory: () => async (canvas, kind, density) => {
    const { NetworkFieldRenderer } = await import('./network-field-renderer');
    return NetworkFieldRenderer.create(canvas, kind, density);
  },
});

@Component({
  selector: 'app-network-field-page',
  imports: [RouterLink],
  templateUrl: './network-field-page.component.html',
  styleUrl: './network-field-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkFieldPageComponent {
  protected readonly t = inject(PortfolioContentService).text;
  protected readonly kind: NetworkKind =
    inject(ActivatedRoute).snapshot.data['network'] === 'services' ? 'services' : 'neural';
  protected readonly scene =
    this.kind === 'neural' ? this.t.networkFields.neural : this.t.networkFields.services;
  protected readonly playing = signal(false);
  protected readonly density = signal(1);
  protected readonly strength = signal(1);
  protected readonly status = signal<'loading' | 'ready' | 'fallback'>('loading');
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly zone = inject(NgZone);
  private readonly destroy = inject(DestroyRef);
  private readonly createRenderer = inject(NETWORK_FIELD_FACTORY);
  private renderer?: NetworkFieldRuntime;
  private request = 0;
  private destroyed = false;
  private visible = true;
  private keyboardPoint: Point = { x: 0.5, y: 0.5 };

  constructor() {
    this.destroy.onDestroy(() => {
      this.destroyed = true;
      this.request++;
      this.renderer?.dispose();
    });
    afterNextRender(() => {
      const canvas = this.canvas().nativeElement;
      const motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.playing.set(!motion.matches);
      const onMotion = () => {
        if (motion.matches) {
          this.playing.set(false);
          this.syncActivity();
        }
      };
      const onVisibility = () => this.syncActivity();
      const resize = new ResizeObserver(() => this.renderer?.resize());
      const observer = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.syncActivity();
      });
      resize.observe(canvas);
      observer.observe(canvas);
      motion.addEventListener('change', onMotion);
      document.addEventListener('visibilitychange', onVisibility);
      this.destroy.onDestroy(() => {
        resize.disconnect();
        observer.disconnect();
        motion.removeEventListener('change', onMotion);
        document.removeEventListener('visibilitychange', onVisibility);
      });
      void this.load();
    });
  }

  private async load(): Promise<void> {
    const request = ++this.request;
    this.status.set('loading');
    this.renderer?.dispose();
    this.renderer = undefined;
    try {
      const renderer = await this.zone.runOutsideAngular(() =>
        this.createRenderer(this.canvas().nativeElement, this.kind, this.density()),
      );
      if (this.destroyed || request !== this.request) {
        renderer.dispose();
        return;
      }
      this.renderer = renderer;
      renderer.setStrength(this.strength());
      this.status.set('ready');
      this.syncActivity();
    } catch {
      if (!this.destroyed && request === this.request) this.status.set('fallback');
    }
  }

  private syncActivity(): void {
    this.zone.runOutsideAngular(() =>
      this.renderer?.setRunning(this.playing() && this.visible && !document.hidden),
    );
  }
  protected toggle(): void {
    this.playing.update((value) => !value);
    this.syncActivity();
  }
  protected setDensity(event: Event): void {
    this.density.set(Number((event.target as HTMLSelectElement).value));
    void this.load();
  }
  protected setStrength(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.strength.set(value);
    this.renderer?.setStrength(value);
  }
  protected pointer(event: PointerEvent): void {
    if (this.status() !== 'ready') return;
    const canvas = this.canvas().nativeElement;
    const point = networkPoint(event.clientX, event.clientY, canvas.getBoundingClientRect());
    if (!point) return;
    if (event.type === 'pointerdown') {
      canvas.focus({ preventScroll: true });
      canvas.setPointerCapture(event.pointerId);
      this.renderer?.pulse(point);
    } else this.renderer?.interact(point);
  }
  protected endInteraction(): void {
    this.renderer?.endInteraction();
  }
  protected pulse(): void {
    this.renderer?.pulse(this.keyboardPoint);
  }
  protected keyboard(event: KeyboardEvent): void {
    if (event.key === ' ') {
      event.preventDefault();
      this.toggle();
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      this.pulse();
      return;
    }
    const moves: Record<string, Point> = {
      ArrowLeft: { x: -0.04, y: 0 },
      ArrowRight: { x: 0.04, y: 0 },
      ArrowUp: { x: 0, y: -0.04 },
      ArrowDown: { x: 0, y: 0.04 },
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    this.keyboardPoint = {
      x: Math.max(0, Math.min(1, this.keyboardPoint.x + move.x)),
      y: Math.max(0, Math.min(1, this.keyboardPoint.y + move.y)),
    };
    this.renderer?.interact(this.keyboardPoint);
  }
}
