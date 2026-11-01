import * as THREE from 'three';
import {
  ageTrail,
  MAX_TRAIL_MARKS,
  sampleParticleImage,
  TrailMark,
  trailEnvelope,
} from './particle-image.math';
import { IMAGE_PARTICLE_FRAGMENT, IMAGE_PARTICLE_VERTEX } from './particle-image.shaders';

export class ParticleImageRenderer {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
  private readonly trailCanvas = document.createElement('canvas');
  private readonly trailContext: CanvasRenderingContext2D;
  private readonly trailTexture: THREE.CanvasTexture;
  private readonly material: THREE.ShaderMaterial;
  private mesh?: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial>;
  private marks: TrailMark[] = [];
  private lastPoint?: { x: number; y: number };
  private frame: number | null = null;
  private lastTime = 0;
  private elapsed = 0;
  private reveal = 1;
  private active = true;
  private disposed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private reducedMotion: boolean,
  ) {
    this.trailCanvas.width = this.trailCanvas.height = 128;
    const context = this.trailCanvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D is unavailable');
    this.trailContext = context;
    this.trailTexture = new THREE.CanvasTexture(this.trailCanvas);
    this.trailTexture.minFilter = THREE.LinearFilter;
    this.trailTexture.generateMipmaps = false;
    this.material = new THREE.ShaderMaterial({
      vertexShader: IMAGE_PARTICLE_VERTEX,
      fragmentShader: IMAGE_PARTICLE_FRAGMENT,
      uniforms: {
        trail: { value: this.trailTexture },
        clock: { value: 0 },
        reveal: { value: 1 },
        motion: { value: reducedMotion ? 0 : 1 },
        sampleStep: { value: 2 / 256 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
    this.renderer.setClearColor(0x050607);
    this.resize();
  }

  setImage(image: HTMLImageElement): void {
    const sample = document.createElement('canvas');
    sample.width = sample.height = 256;
    const context = sample.getContext('2d');
    if (!context) throw new Error('Image sampling is unavailable');
    context.fillStyle = '#000';
    context.fillRect(0, 0, 256, 256);
    const scale = Math.min(256 / image.naturalWidth, 256 / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.drawImage(image, (256 - width) / 2, (256 - height) / 2, width, height);
    const data = sampleParticleImage(context.getImageData(0, 0, 256, 256).data, 256, 256);
    const quad = new THREE.PlaneGeometry(1, 1);
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = quad.index!.clone();
    geometry.setAttribute('position', quad.getAttribute('position').clone());
    geometry.setAttribute('uv', quad.getAttribute('uv').clone());
    quad.dispose();
    geometry.setAttribute('center', new THREE.InstancedBufferAttribute(data.centers, 2));
    geometry.setAttribute('tone', new THREE.InstancedBufferAttribute(data.tones, 1));
    geometry.setAttribute('seed', new THREE.InstancedBufferAttribute(data.seeds, 1));
    geometry.instanceCount = data.tones.length;
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
    }
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
    this.marks = [];
    this.lastPoint = undefined;
    this.reveal = this.reducedMotion ? 1 : 0;
    this.draw(0);
    this.schedule();
  }

  resize(): void {
    if (this.disposed) return;
    const { width, height } = this.canvas.getBoundingClientRect();
    const w = Math.max(1, width),
      h = Math.max(1, height);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.position.z = Math.max(1, h / w) / (0.86 * Math.tan(THREE.MathUtils.degToRad(20)));
    this.camera.updateProjectionMatrix();
    this.draw(0);
  }

  interact(point: { x: number; y: number }): void {
    if (this.disposed) return;
    const distance = this.lastPoint
      ? Math.hypot(point.x - this.lastPoint.x, point.y - this.lastPoint.y)
      : 0.03;
    this.marks.push({ ...point, age: 0.08, strength: Math.min(1, 0.3 + distance * 15) });
    this.marks = this.marks.slice(-MAX_TRAIL_MARKS);
    this.lastPoint = point;
    if (this.reducedMotion) this.draw(0);
    else this.schedule();
  }

  endInteraction(): void {
    this.lastPoint = undefined;
    if (this.reducedMotion) {
      this.marks = [];
      this.draw(0);
    }
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
    this.material.uniforms['motion'].value = value ? 0 : 1;
    this.reveal = 1;
    this.marks = [];
    this.stop();
    this.draw(0);
    this.schedule();
  }

  setActive(value: boolean): void {
    this.active = value;
    if (value) this.schedule();
    else {
      this.stop();
      this.marks = [];
      this.lastPoint = undefined;
    }
  }

  private schedule(): void {
    if (this.disposed || !this.active || this.reducedMotion || this.frame !== null) return;
    this.lastTime = performance.now();
    this.frame = requestAnimationFrame(this.tick);
  }

  private readonly tick = (now: number): void => {
    this.frame = null;
    if (this.disposed || !this.active) return;
    // Trail lifetime is wall-clock based even on a slow GPU. Visibility resumes
    // reset lastTime, so a suspended tab never advances the simulation in a jump.
    const seconds = Math.max(0, (now - this.lastTime) / 1000);
    if (seconds < 1 / 30) {
      this.frame = requestAnimationFrame(this.tick);
      return;
    }
    this.lastTime = now;
    this.draw(seconds);
    this.frame = requestAnimationFrame(this.tick);
  };

  private draw(seconds: number): void {
    if (this.disposed) return;
    this.elapsed += seconds;
    this.reveal = Math.min(1, this.reveal + seconds * 1.6);
    this.marks = ageTrail(this.marks, seconds);
    const context = this.trailContext;
    context.fillStyle = '#000';
    context.fillRect(0, 0, 128, 128);
    for (const mark of this.marks) {
      const strength = trailEnvelope(mark.age) * mark.strength;
      const x = mark.x * 128,
        y = (1 - mark.y) * 128;
      const radius = 128 * 0.085 * (0.6 + strength * 0.4);
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255,255,255,${strength})`);
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
      context.fillStyle = gradient;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    this.trailTexture.needsUpdate = true;
    this.material.uniforms['clock'].value = this.elapsed;
    this.material.uniforms['reveal'].value = 1 - Math.pow(1 - this.reveal, 3);
    this.renderer.render(this.scene, this.camera);
  }

  private stop(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    this.mesh?.geometry.dispose();
    this.material.dispose();
    this.trailTexture.dispose();
    this.renderer.dispose();
  }
}
