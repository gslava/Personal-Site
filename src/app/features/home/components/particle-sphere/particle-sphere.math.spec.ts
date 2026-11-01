import * as THREE from 'three';
import { projectPointerToPlane } from './particle-sphere.math';

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
});
