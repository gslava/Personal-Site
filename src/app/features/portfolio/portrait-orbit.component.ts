import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { PortfolioContentService } from '../../core/content/portfolio-content';
import { ParticleSphereComponent } from '../home/components/particle-sphere/particle-sphere.component';

@Component({
  selector: 'app-portrait-orbit',
  imports: [ParticleSphereComponent],
  template: `
    <div #portrait class="portrait-orbit">
      <div class="portrait-orbit__field" aria-hidden="true">
        @if (playing()) {
          @defer (on viewport) {
            <app-particle-sphere [compact]="true" [pointerTarget]="portrait" />
          } @placeholder {
            <span></span>
          }
        }
      </div>
      <img
        class="portrait"
        src="images/viacheslav-avatar.png"
        width="1254"
        height="1254"
        [alt]="t.portraitAlt"
        fetchpriority="high"
      />
      <button
        class="portrait-orbit__toggle"
        type="button"
        [attr.aria-label]="playing() ? t.pause : t.play"
        [attr.title]="playing() ? t.pause : t.play"
        [attr.aria-pressed]="playing()"
        (click)="playing.set(!playing())"
      >
        @if (playing()) {
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M7 5v10M13 5v10" /></svg>
        } @else {
          <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 5 8 5-8 5Z" /></svg>
        }
      </button>
    </div>
  `,
  styleUrl: './portrait-orbit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortraitOrbitComponent {
  protected readonly t = inject(PortfolioContentService).text;
  protected readonly playing = signal(true);

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      if (!window.matchMedia) return;
      const motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.playing.set(!motion.matches);
      const onMotion = () => this.playing.set(!motion.matches);
      motion.addEventListener('change', onMotion);
      destroy.onDestroy(() => motion.removeEventListener('change', onMotion));
    });
  }
}
