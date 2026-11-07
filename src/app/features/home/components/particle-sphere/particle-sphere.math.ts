import { ThreeModule } from './particle-sphere.types';

export function framePortraitCamera(
  camera: import('three').PerspectiveCamera,
  anchor: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  viewport: Pick<DOMRect, 'width' | 'height'>,
): void {
  const width = Math.max(1, anchor.width * 1.24);
  const height = Math.max(1, anchor.height * 1.24);
  camera.setViewOffset(
    width,
    height,
    width / 2 - (anchor.left + anchor.width / 2),
    height / 2 - (anchor.top + anchor.height / 2),
    viewport.width,
    viewport.height,
  );
}

export function projectPointerToPlane(
  THREE: ThreeModule,
  camera: import('three').PerspectiveCamera,
  clientX: number,
  clientY: number,
  viewport: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
): import('three').Vector3 {
  const x = -1 + (2 * (clientX - viewport.left)) / Math.max(1, viewport.width);
  const y = 1 - (2 * (clientY - viewport.top)) / Math.max(1, viewport.height);

  const position = new THREE.Vector3(x, y, 0.5).unproject(camera);
  const direction = position.sub(camera.position).normalize();
  const distance = -camera.position.z / direction.z;

  return camera.position.clone().add(direction.multiplyScalar(distance));
}

export function easeOutExpo(value: number): number {
  if (value >= 1) {
    return 1;
  }

  return 1 - 2 ** (-10 * value);
}

export function easeOutPower(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  return 1 - (1 - clamped) * (1 - clamped);
}
