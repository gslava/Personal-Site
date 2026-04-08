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
import {
  HOME_SCENE_CAMERA_FOV_DEG,
  HOME_SCENE_CAMERA_Z,
  HOME_SCENE_PARTICLE_RADIUS,
} from '../../home-scene.constants';
import { easeOutExpo, easeOutPower, projectPointerToPlane } from './particle-sphere.math';
import { createParticlePoints } from './particle-sphere.points';
import { createSimulation } from './particle-sphere.simulation';
import {
  GpuComputationRendererClass,
  ScalarTween,
  ThreeModule,
  VectorTween,
} from './particle-sphere.types';

@Component({
  selector: 'app-particle-sphere',
  templateUrl: './particle-sphere.component.html',
  styleUrl: './particle-sphere.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticleSphereComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  protected readonly fallbackActive = signal(false);

  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

  private animationFrameId: number | null = null;
  private cleanupCallbacks: Array<() => void> = [];
  private destroyed = false;
  private isVisible = true;

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.supportsInteractiveCanvas()) {
      this.fallbackActive.set(true);
      return;
    }

    try {
      const [three, gpuComputationModule] = await Promise.all([
        import('three'),
        import('three/examples/jsm/misc/GPUComputationRenderer.js'),
      ]);

      this.ngZone.runOutsideAngular(() => {
        this.initializeScene(three, gpuComputationModule.GPUComputationRenderer);
      });
    } catch (error) {
      console.error('Failed to initialize particle sphere', error);
      this.fallbackActive.set(true);
    }
  }

  private initializeScene(THREE: ThreeModule, GPUComputationRenderer: GpuComputationRendererClass): void {
    const canvas = this.canvasRef.nativeElement;
    const windowRef = this.document.defaultView;

    if (!windowRef) {
      this.fallbackActive.set(true);
      return;
    }

    const fboSize = this.resolveFboSize();
    const simulationRadius = HOME_SCENE_PARTICLE_RADIUS;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      powerPreference: 'high-performance',
    });
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(HOME_SCENE_CAMERA_FOV_DEG, 1, 0.1, 1000);
    camera.position.z = HOME_SCENE_CAMERA_Z;

    const gpuCompute = new GPUComputationRenderer(fboSize, fboSize, renderer);
    const simulation = createSimulation(THREE, gpuCompute, fboSize, simulationRadius, windowRef);
    const particles = createParticlePoints(this.document, THREE, fboSize, windowRef);
    const animationStart = windowRef.performance.now();
    const projectedMouse = new THREE.Vector3();
    const screenMouse = new THREE.Vector2();
    const smoothedMouse = new THREE.Vector2(windowRef.innerWidth, 0);
    const previousMouse = smoothedMouse.clone();
    const interactionTarget = this.document.body ?? canvas;
    const mouseTween: VectorTween = {
      active: false,
      startMs: animationStart,
      durationMs: 500,
      from: smoothedMouse.clone(),
      to: smoothedMouse.clone(),
    };
    const radiusTween: ScalarTween = {
      active: false,
      startMs: animationStart,
      durationMs: 500,
      from: simulation.acceleration.material.uniforms['repulseRadius'].value,
      to: simulation.acceleration.material.uniforms['repulseRadius'].value,
    };
    let initMouseMove = false;
    let introAnimating = true;

    scene.add(particles.points);

    const updateViewport = (): void => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      const pixelRatio = Math.min(windowRef.devicePixelRatio || 1, 2);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);

      particles.material.uniforms['uColorResolution'].value.set(
        fboSize * (windowRef.innerWidth / 1366),
        fboSize * (windowRef.innerWidth / 1366),
      );
      particles.material.uniforms['uWindowResolution'].value.set(windowRef.innerWidth, windowRef.innerHeight);
      simulation.acceleration.material.uniforms['uWindowResolution'].value.set(
        windowRef.innerWidth,
        windowRef.innerHeight,
      );
    };

    const syncMouse = (nowMs: number): void => {
      previousMouse.copy(smoothedMouse);

      if (mouseTween.active) {
        const progress = Math.min(1, (nowMs - mouseTween.startMs) / mouseTween.durationMs);
        const eased = easeOutPower(progress);
        smoothedMouse.lerpVectors(mouseTween.from, mouseTween.to, eased);

        if (progress >= 1) {
          mouseTween.active = false;
          smoothedMouse.copy(mouseTween.to);
        }
      }

      if (radiusTween.active) {
        const progress = Math.min(1, (nowMs - radiusTween.startMs) / radiusTween.durationMs);
        const eased = easeOutPower(progress);
        simulation.acceleration.material.uniforms['repulseRadius'].value =
          radiusTween.from + (radiusTween.to - radiusTween.from) * eased;

        if (progress >= 1) {
          radiusTween.active = false;
          simulation.acceleration.material.uniforms['repulseRadius'].value = radiusTween.to;
        }
      }

      simulation.acceleration.material.uniforms['oldMousePos'].value.copy(previousMouse);
      simulation.acceleration.material.uniforms['mousePos'].value.copy(smoothedMouse);
    };

    const updateIntroState = (elapsed: number): void => {
      const introProgress = Math.min(1, elapsed / 1.35);
      simulation.acceleration.material.uniforms['radius'].value = simulationRadius * easeOutExpo(introProgress);

      if (introAnimating && elapsed >= 1) {
        introAnimating = false;
      }
    };

    const pause = (): void => {
      if (this.animationFrameId === null) {
        return;
      }

      windowRef.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    };

    const renderFrame = (): void => {
      if (this.destroyed) {
        return;
      }

      const nowMs = windowRef.performance.now();
      const elapsed = (nowMs - animationStart) / 1000;
      const centerDistance = screenMouse.length();
      const halfWindow = Math.max(1, windowRef.innerWidth / 2);

      updateIntroState(elapsed);
      syncMouse(nowMs);
      gpuCompute.compute();

      if (introAnimating) {
        simulation.acceleration.material.uniforms['time'].value += elapsed * 0.02;
      } else {
        simulation.acceleration.material.uniforms['time'].value +=
          0.006 * (0.3 * Math.min(0.3, 1 - centerDistance / halfWindow));
      }

      particles.material.uniforms['uPositions'].value = gpuCompute.getCurrentRenderTarget(simulation.positions).texture;
      particles.material.uniforms['uTime'].value = elapsed * 0.5;
      renderer.render(scene, camera);

      if (this.isVisible) {
        this.animationFrameId = windowRef.requestAnimationFrame(renderFrame);
      } else {
        this.animationFrameId = null;
      }
    };

    const resume = (): void => {
      if (this.destroyed || !this.isVisible || this.animationFrameId !== null) {
        return;
      }

      this.animationFrameId = windowRef.requestAnimationFrame(renderFrame);
    };

    const handleMouseMove = (event: MouseEvent): void => {
      const nowMs = windowRef.performance.now();
      syncMouse(nowMs);
      projectedMouse.copy(projectPointerToPlane(THREE, camera, event.clientX, event.clientY, windowRef));

      screenMouse.set(
        Math.abs(event.clientX - windowRef.innerWidth / 2),
        Math.abs(event.clientY - windowRef.innerHeight / 2),
      );

      if (!initMouseMove) {
        smoothedMouse.set(projectedMouse.x, -projectedMouse.y);
        simulation.acceleration.material.uniforms['mousePos'].value.copy(smoothedMouse);
        simulation.acceleration.material.uniforms['oldMousePos'].value.copy(smoothedMouse);
        initMouseMove = true;
      } else {
        mouseTween.active = true;
        mouseTween.startMs = nowMs;
        mouseTween.from.copy(smoothedMouse);
        mouseTween.to.set(projectedMouse.x, -projectedMouse.y);
      }

      const repulseRadiusTarget =
        simulationRadius * 0.3 +
        simulationRadius * 0.2 * (1 - screenMouse.length() / Math.max(1, windowRef.innerWidth / 2));

      radiusTween.active = true;
      radiusTween.startMs = nowMs;
      radiusTween.from = simulation.acceleration.material.uniforms['repulseRadius'].value;
      radiusTween.to = repulseRadiusTarget;
    };

    const handleVisibility = (): void => {
      this.isVisible = !this.document.hidden;

      if (this.isVisible) {
        resume();
      } else {
        pause();
      }
    };

    const resizeObserver = new ResizeObserver(() => updateViewport());
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        this.isVisible = entry?.isIntersecting ?? true;

        if (this.isVisible) {
          resume();
        } else {
          pause();
        }
      },
      { threshold: 0.08 },
    );

    updateViewport();
    intersectionObserver.observe(canvas);
    interactionTarget.addEventListener('mousemove', handleMouseMove, { passive: true });
    this.document.addEventListener('visibilitychange', handleVisibility);

    resume();

    this.cleanupCallbacks.push(
      () => pause(),
      () => resizeObserver.disconnect(),
      () => intersectionObserver.disconnect(),
      () => interactionTarget.removeEventListener('mousemove', handleMouseMove),
      () => this.document.removeEventListener('visibilitychange', handleVisibility),
      () => {
        particles.geometry.dispose();
        particles.material.dispose();
        particles.gradient.dispose();
        gpuCompute.dispose();
        renderer.dispose();
      },
    );

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.cleanupCallbacks.forEach((cleanup) => cleanup());
      this.cleanupCallbacks = [];
    });
  }

  private supportsInteractiveCanvas(): boolean {
    if (
      typeof ResizeObserver === 'undefined' ||
      typeof IntersectionObserver === 'undefined' ||
      typeof WebGLRenderingContext === 'undefined'
    ) {
      return false;
    }

    try {
      const probe = this.document.createElement('canvas');
      return !!probe.getContext('webgl');
    } catch {
      return false;
    }
  }

  private resolveFboSize(): number {
    const width = this.document.defaultView?.innerWidth ?? 1440;

    if (width > 1920) {
      return 1024;
    }

    return 512;
  }
}
