import * as THREE from 'three';
import { framePortraitCamera, projectPointerToPlane } from './particle-sphere.math';

describe('particle pointer projection', () => {
  it('projects the canvas center to the field origin even below a sticky header', () => {
    const camera = new THREE.PerspectiveCamera(60, 2, 0.1, 1000);
    camera.position.z = 300;
    camera.updateMatrixWorld();
    const point = projectPointerToPlane(THREE, camera, 400, 280, {
      left: 0,
      top: 80,
      width: 800,
      height: 400,
    });
    expect(point.x).toBeCloseTo(0);
    expect(point.y).toBeCloseTo(0);
    expect(point.z).toBeCloseTo(0);
  });

  it('keeps the sphere centered on the avatar with equal horizontal and vertical scale', () => {
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 300;
    camera.updateMatrixWorld();
    framePortraitCamera(
      camera,
      { left: 900, top: 260, width: 260, height: 260 },
      {
        width: 1440,
        height: 1000,
      },
    );
    const center = new THREE.Vector3().project(camera);
    expect((center.x + 1) * 720).toBeCloseTo(1030);
    expect((1 - center.y) * 500).toBeCloseTo(390);
    const right = new THREE.Vector3(100, 0, 0).project(camera);
    const up = new THREE.Vector3(0, 100, 0).project(camera);
    expect((right.x - center.x) * 720).toBeCloseTo((up.y - center.y) * 500);
    const pointer = projectPointerToPlane(THREE, camera, 1030, 390, {
      left: 0,
      top: 0,
      width: 1440,
      height: 1000,
    });
    expect(pointer.x).toBeCloseTo(0);
    expect(pointer.y).toBeCloseTo(0);
  });

  it('renders outside the old avatar canvas and follows the portrait while scrolling', () => {
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.z = 300;
    camera.updateMatrixWorld();
    const viewport = { width: 1440, height: 1000 };
    const anchor = { left: 900, top: 260, width: 260, height: 260 };
    framePortraitCamera(camera, anchor, viewport);
    const escaped = new THREE.Vector3(240, 0, 0).project(camera);
    expect((escaped.x + 1) * 720).toBeGreaterThan(900 + 260 * 1.12);
    expect(Math.abs(escaped.x)).toBeLessThan(1);
    framePortraitCamera(camera, { ...anchor, top: 160 }, viewport);
    const center = new THREE.Vector3().project(camera);
    expect((1 - center.y) * 500).toBeCloseTo(290);
  });
});
