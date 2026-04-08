import { createGradientTexture } from './particle-sphere.textures';
import { ParticlePoints, ThreeModule } from './particle-sphere.types';

export function createParticlePoints(
  documentRef: Document,
  THREE: ThreeModule,
  fboSize: number,
  windowRef: Window,
): ParticlePoints {
  const total = fboSize * fboSize;
  const vertices = new Float32Array(total * 3);

  for (let index = 0; index < total; index += 1) {
    const pointer = index * 3;
    vertices[pointer] = Math.random() * fboSize;
    vertices[pointer + 1] = Math.random() * fboSize;
    vertices[pointer + 2] = 0;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  const gradient = createGradientTexture(documentRef, THREE);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uGradient: { value: gradient },
      uPositions: { value: null },
      uTime: { value: 0 },
      uPositionsResolution: { value: new THREE.Vector2(fboSize, fboSize) },
      uColorResolution: {
        value: new THREE.Vector2(fboSize * (windowRef.innerWidth / 1366), fboSize * (windowRef.innerWidth / 1366)),
      },
      uWindowResolution: { value: new THREE.Vector2(windowRef.innerWidth, windowRef.innerHeight) },
    },
    vertexShader: `
      uniform sampler2D uPositions;
      uniform vec2 uPositionsResolution;

      varying float vColored;

      void main() {
        vec2 uv = position.xy / uPositionsResolution.xy;
        vec4 pos = texture2D(uPositions, uv);

        vColored = pos.w;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos.xy, 1.0, 1.0);
        gl_PointSize = 1.0;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform sampler2D uGradient;
      uniform vec2 uColorResolution;
      uniform vec2 uWindowResolution;
      uniform float uTime;

      varying float vColored;

      void main() {
        vec2 st = gl_FragCoord.xy / uColorResolution;
        float x = st.x + (cos(uTime * 2.0) - 1.0) + 0.5;
        float y = st.y + (sin(uTime * 2.0) - 1.0) + 1.5;

        vec3 gradientColor = texture2D(uGradient, vec2(x, y)).xyz;
        vec3 color = vec3(gradientColor.x);
        float intensity = 1.0 - vColored;
        color += (vec3(1.0) - color) * intensity;

        gl_FragColor = vec4(color, 1.0);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });

  return {
    geometry,
    material,
    points: new THREE.Points(geometry, material),
    gradient,
  };
}
