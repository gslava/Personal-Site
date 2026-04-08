import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { ParticleSphereComponent } from '../../components/particle-sphere/particle-sphere.component';
import {
  HOME_SCENE_CAMERA_FOV_DEG,
  HOME_SCENE_CAMERA_Z,
  HOME_SCENE_PARTICLE_RADIUS,
} from '../../home-scene.constants';

@Component({
  selector: 'app-home-page',
  imports: [ParticleSphereComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements AfterViewInit {
  @ViewChild('sceneRoot', { static: true }) private readonly sceneRootRef!: ElementRef<HTMLElement>;

  protected readonly foxWidthPx = signal(0);

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId) || typeof ResizeObserver === 'undefined') {
      return;
    }

    const windowRef = this.document.defaultView;

    if (!windowRef) {
      return;
    }

    const sceneRoot = this.sceneRootRef.nativeElement;
    const updateFoxSize = (): void => {
      const rect = sceneRoot.getBoundingClientRect();
      const projectedRadius =
        HOME_SCENE_PARTICLE_RADIUS *
        (rect.height / (2 * Math.tan((HOME_SCENE_CAMERA_FOV_DEG * Math.PI) / 360) * HOME_SCENE_CAMERA_Z));

      // The fox should now be 3x larger than before: 30% of the sphere radius.
      this.foxWidthPx.set(projectedRadius * 0.3);
    };

    this.ngZone.runOutsideAngular(() => {
      const resizeObserver = new ResizeObserver(() => updateFoxSize());
      resizeObserver.observe(sceneRoot);
      updateFoxSize();

      this.destroyRef.onDestroy(() => resizeObserver.disconnect());
    });
  }
}
