import {
  tsParticles,
  type Container,
  type IContainerPlugin,
  type ISourceOptions,
  type Particle,
} from '@tsparticles/engine';
import { loadSlim } from '@tsparticles/slim';
import {
  fieldPosition,
  networkCount,
  networkSeeds,
  type NetworkKind,
  type Point,
  type Pulse,
} from './network-field.math';

let sequence = 0;
let engineReady: Promise<void> | undefined;
const fields = new Map<string, NetworkFieldRenderer>();

// All drawing, links, hover interactions and frame scheduling belong to tsParticles.
// This plugin positions particles before the engine rebuilds its spatial grid.
export class NetworkFieldRenderer {
  private container?: Container;
  private time = 0;
  private running = false;
  private pointer?: Point;
  private strength = 1;
  private pulses: Pulse[] = [];
  private disposed = false;
  private readonly name = 'portfolio-network-' + ++sequence;
  private readonly seeds;

  private constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly kind: NetworkKind,
    density: number,
  ) {
    this.seeds = networkSeeds(kind, networkCount(density, canvas.clientWidth));
  }

  static async create(
    canvas: HTMLCanvasElement,
    kind: NetworkKind,
    density: number,
  ): Promise<NetworkFieldRenderer> {
    const renderer = new NetworkFieldRenderer(canvas, kind, density);
    try {
      await renderer.initialize();
      return renderer;
    } catch (error) {
      renderer.dispose();
      throw error;
    }
  }

  private async initialize(): Promise<void> {
    engineReady ??= loadSlim(tsParticles).then(() =>
      tsParticles.pluginManager.addPlugin({
        id: 'portfolio-network-field',
        needsPlugin: (options) => typeof options?.name === 'string' && fields.has(options.name),
        loadOptions: () => {},
        getPlugin: async (container): Promise<IContainerPlugin> => {
          const field = fields.get(container.sourceOptions?.name ?? '');
          if (!field) return {};
          return {
            update: (delta) => {
              if (field.running) field.time += Math.min(delta.value, 50) / 1000;
              field.pulses = field.pulses.filter((pulse) => field.time - pulse.born <= 2.4);
            },
            particleUpdate: (particle) => field.position(particle, container),
          };
        },
      }),
    );
    await engineReady;
    fields.set(this.name, this);
    const neural = this.kind === 'neural';
    const options: ISourceOptions = {
      name: this.name,
      autoPlay: false,
      fullScreen: false,
      detectRetina: false,
      fpsLimit: 45,
      pauseOnBlur: false,
      pauseOnOutsideViewport: false,
      background: { color: '#05080e' },
      particles: {
        number: {
          value: this.seeds.length,
          density: { enable: false },
          limit: { value: this.seeds.length },
        },
        paint: {
          color: {
            value: neural ? ['#a9a0ff', '#65d6ef', '#ddd6ff'] : ['#62dcca', '#f2b979', '#a7e5e0'],
          },
          fill: { enable: true, opacity: 1 },
        },
        shape: { type: 'circle' },
        size: { value: { min: 0.7, max: 2.1 } },
        opacity: { value: 0.65 },
        move: { enable: false },
        links: {
          enable: true,
          distance: Math.min(100, Math.max(48, this.canvas.clientWidth * 0.075)),
          color: neural ? '#9795e8' : '#60bdb4',
          opacity: neural ? 0.23 : 0.19,
          width: 0.7,
          triangles: { enable: false },
        },
      },
      interactivity: {
        detectsOn: 'canvas',
        events: { onHover: { enable: true, mode: ['grab', 'bubble'] } },
        modes: {
          grab: { distance: 170, links: { opacity: 0.65, color: neural ? '#c7b5ff' : '#ecc18f' } },
          bubble: { distance: 130, size: 3.5, opacity: 1, color: neural ? '#e4dbff' : '#fff0d8' },
        },
      },
    };
    const focused = document.activeElement === this.canvas;
    if (focused) this.canvas.blur();
    try {
      this.container = await tsParticles.load({ id: this.name, element: this.canvas, options });
    } finally {
      // The engine treats canvases as decorative; these fields are keyboard controls.
      this.canvas.removeAttribute('aria-hidden');
      if (focused) this.canvas.focus({ preventScroll: true });
    }
    if (!this.container) throw new Error('tsParticles canvas unavailable');
    this.renderStill();
  }

  private position(particle: Particle, container: Container): void {
    const seed = this.seeds[particle.id % this.seeds.length];
    const { width, height } = container.canvas.size;
    const point = fieldPosition(
      seed,
      this.kind,
      this.time,
      this.pointer,
      this.strength,
      this.pulses,
      width / Math.max(height, 1),
    );
    particle.position.x = point.x * width;
    particle.position.y = point.y * height;
    particle.position.z = 0;
    if (particle.opacity)
      particle.opacity.value =
        0.4 + point.energy * 0.35 + (Math.sin(this.time * 1.4 + seed.phase) + 1) * 0.1;
    particle.size.value = (seed.relay ? 1.6 : 0.8 + (seed.phase % 1) * 1.2) + point.energy * 1.2;
  }

  setRunning(running: boolean): void {
    if (this.disposed) return;
    this.running = running;
    if (running) this.container?.play();
    else {
      this.container?.pause();
      this.renderStill();
    }
  }
  setStrength(value: number): void {
    this.strength = value;
    this.renderStill();
  }
  interact(point: Point): void {
    this.pointer = point;
    this.renderStill();
  }
  endInteraction(): void {
    this.pointer = undefined;
    this.renderStill();
  }
  pulse(point: Point): void {
    this.pulses = [...this.pulses.slice(-3), { ...point, born: this.time }];
    this.renderStill();
  }
  resize(): void {
    void this.container?.canvas.windowResize().then(() => this.renderStill());
  }
  private renderStill(): void {
    if (!this.running && !this.disposed) {
      this.container?.pause();
      this.container?.draw(true);
    }
  }
  dispose(): void {
    this.disposed = true;
    this.running = false;
    this.pulses = [];
    this.container?.destroy();
    this.container = undefined;
    fields.delete(this.name);
  }
}
