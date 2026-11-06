import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  NgZone,
} from '@angular/core';
import { constellation, constellationLinks, motifFlowRoutes } from './project-motif-particles.data';

/** Decorative project metaphors, not product screens, architecture or measured data. */
@Component({
  selector: 'app-project-motif',
  host: { 'aria-hidden': 'true' },
  templateUrl: './project-motif.component.html',
  styleUrl: './project-motif.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMotifComponent {
  readonly variant = input.required<string>();
  protected readonly parts = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  protected readonly stars = constellation;
  protected readonly links = constellationLinks;
  protected readonly routes = motifFlowRoutes;

  constructor() {
    const host = inject(ElementRef<HTMLElement>).nativeElement;
    const destroy = inject(DestroyRef);
    const zone = inject(NgZone);
    let dispose: (() => void) | undefined;
    destroy.onDestroy(() => dispose?.());
    afterNextRender(() => {
      // Keep browser-only drawing out of static rendering and the first paint.
      if (!window.matchMedia || !window.IntersectionObserver || !window.ResizeObserver) return;
      void import('./project-motif-particles').then(
        ({ attachMotifParticles }) => {
          if (!destroy.destroyed) {
            zone.runOutsideAngular(() => {
              dispose = attachMotifParticles(host, this.variant());
            });
          }
        },
        // The static illustration remains usable if the optional chunk cannot load.
        () => undefined,
      );
    });
  }
}
