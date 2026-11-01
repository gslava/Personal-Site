import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PortfolioContentService } from '../../core/content/portfolio-content';
import { ParticleSphereComponent } from '../home/components/particle-sphere/particle-sphere.component';

@Component({
  selector: 'app-particle-page',
  imports: [RouterLink, ParticleSphereComponent],
  template: ` <section class="experiment">
    @if (playing()) {
      <app-particle-sphere />
    } @else {
      <div class="static-cloud" aria-hidden="true"></div>
    }
    <div class="experiment-toolbar container">
      <a class="text-link" routerLink="/experiments">← {{ t.backExperiments }}</a
      ><button
        class="button"
        type="button"
        [attr.aria-pressed]="playing()"
        (click)="playing.set(!playing())"
      >
        {{ playing() ? t.pause : t.play }}
      </button>
    </div>
    <div class="experiment-title container">
      <h1>{{ t.particleTitle }}</h1>
      <p>{{ playing() ? t.particleHelp : t.staticHelp }}</p>
    </div>
  </section>`,
  styles: [
    `
      :host {
        display: block;
      }
      .experiment {
        display: flex;
        flex-direction: column;
        min-height: calc(100dvh - var(--site-header-height));
        position: relative;
        isolation: isolate;
        overflow: hidden;
        background: #08090a;
      }
      app-particle-sphere {
        position: absolute;
        inset: 0;
        z-index: -1;
      }
      .experiment-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding-top: 1.5rem;
      }
      .experiment-title {
        margin-top: auto;
        padding-bottom: 2rem;
        pointer-events: none;
      }
      h1 {
        font-size: 2rem;
        margin: 0;
      }
      p {
        max-width: 55ch;
        font-size: 0.85rem;
        background: rgba(8, 9, 10, 0.8);
        width: fit-content;
      }
      .static-cloud {
        position: absolute;
        width: min(60vw, 460px);
        aspect-ratio: 1;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: -1;
        border-radius: 50%;
        background: radial-gradient(circle, #eee 1px, transparent 1.5px) 0 0/5px 5px;
        mask-image: radial-gradient(circle, transparent 4%, #000 38%, #000 54%, transparent 70%);
      }
      @media (max-width: 767px) {
        .experiment-toolbar {
          gap: 0.5rem;
        }
        .button {
          font-size: 0.7rem;
          padding: 0.7rem;
        }
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticlePageComponent {
  protected readonly t = inject(PortfolioContentService).text;
  protected readonly playing = signal(true);
}
