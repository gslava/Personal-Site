import { ThreeModule } from './particle-sphere.types';

export function createGradientTexture(
  documentRef: Document,
  THREE: ThreeModule,
): import('three').Texture {
  const canvas = documentRef.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const context = canvas.getContext('2d');

  if (!context) {
    const texture = new THREE.Texture();
    texture.needsUpdate = true;
    return texture;
  }

  const base = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  base.addColorStop(0, '#121212');
  base.addColorStop(0.25, '#a8a8a8');
  base.addColorStop(0.5, '#4b4b4b');
  base.addColorStop(0.75, '#d8d8d8');
  base.addColorStop(1, '#1d1d1d');
  context.fillStyle = base;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < 10; index += 1) {
    const x = ((index * 73) % 512) + 24;
    const y = ((index * 101) % 512) + 24;
    const radius = 64 + (index % 4) * 34;
    const glow = context.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    glow.addColorStop(0.35, 'rgba(210, 210, 210, 0.42)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.globalCompositeOperation = 'screen';
    context.fillStyle = glow;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();
  }

  context.globalCompositeOperation = 'soft-light';
  for (let y = 0; y < canvas.height; y += 16) {
    const alpha = 0.05 + ((y / canvas.height) % 0.12);
    context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    context.fillRect(0, y, canvas.width, 8);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

export function createInitialData(size: number): Float32Array {
  const total = size * size;
  const data = new Float32Array(total * 4);
  let offset = 0;

  for (let index = 0; index < total; index += 1) {
    data[offset] = Math.random() * 2;
    data[offset + 1] = Math.random() * 1;
    data[offset + 2] = 0.2;
    data[offset + 3] = Math.random();
    offset += 4;
  }

  return data;
}

export function createDataTexture(
  THREE: ThreeModule,
  size: number,
  source: Float32Array<ArrayBufferLike>,
): import('three').DataTexture {
  const texture = new THREE.DataTexture(new Float32Array(source), size, size, THREE.RGBAFormat, THREE.FloatType);
  texture.needsUpdate = true;
  return texture;
}

export function createEmptyTexture(THREE: ThreeModule, size: number): import('three').DataTexture {
  const data = new Float32Array(size * size * 4);
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType);
  texture.needsUpdate = true;
  return texture;
}
