import { ThreeModule } from './particle-sphere.types';

export function projectPointerToPlane(
  THREE: ThreeModule,
  camera: import('three').PerspectiveCamera,
  clientX: number,
  clientY: number,
  windowRef: Window,
): import('three').Vector3 {
  const x = -1 + (2 * clientX) / windowRef.innerWidth;
  const y = -1 + (2 * clientY) / windowRef.innerHeight;

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
