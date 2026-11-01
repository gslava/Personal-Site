import { CINEMATIC_FINISH, CINEMATIC_SHADERS, CinematicScene } from './cinematic-shaders';
import { SceneEvents } from './scene-events';
import { AdaptiveResolution, drawingSize, RenderQuality } from './visual-quality';
import { VERTEX_SHADER, VisualScene } from './visual-shaders';

function compileProgram(gl: WebGLRenderingContext, fragment: string): WebGLProgram {
  const shaders: WebGLShader[] = [];
  let program: WebGLProgram | null = null;
  try {
    for (const [type, source] of [
      [gl.VERTEX_SHADER, VERTEX_SHADER],
      [gl.FRAGMENT_SHADER, fragment],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error('Cannot allocate shader');
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed');
    }
    program = gl.createProgram();
    if (!program) throw new Error('Cannot allocate program');
    shaders.forEach((shader) => gl.attachShader(program!, shader));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Shader link failed');
    return program;
  } catch (error) {
    if (program) gl.deleteProgram(program);
    throw error;
  } finally {
    shaders.forEach((shader) => gl.deleteShader(shader));
  }
}

/** One scene triangle plus an optional offscreen pass for cinematic bloom. */
export class VisualRenderer {
  private readonly gl: WebGLRenderingContext;
  private readonly program: WebGLProgram;
  private readonly buffer: WebGLBuffer;
  private readonly position: number;
  private readonly uniforms: Record<string, WebGLUniformLocation | null>;
  private finishProgram?: WebGLProgram;
  private finishPosition = 0;
  private finishUniforms: Record<string, WebGLUniformLocation | null> = {};
  private texture?: WebGLTexture;
  private framebuffer?: WebGLFramebuffer;
  private readonly assets: { texture: WebGLTexture; uniform: string; image: HTMLImageElement }[] =
    [];
  private events = new SceneEvents();
  satelliteCount = 12;
  orbitalDistance = 1;
  private frame = 0;
  private previous = 0;
  private elapsed = 12;
  private active = false;
  private disposed = false;
  private quality: RenderQuality = 'auto';
  private readonly adaptive = new AdaptiveResolution();
  speed = 1;
  intensity = 1;
  palette = 0;
  camera = 0;
  pointer = { x: 0, y: 0 };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    scene: VisualScene,
    private readonly assetFailed: () => void = () => undefined,
  ) {
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: 'low-power',
    });
    if (!gl) throw new Error('WebGL is unavailable');
    this.gl = gl;
    const cinematic = CINEMATIC_SHADERS[scene as CinematicScene];
    this.program = compileProgram(gl, cinematic);
    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(this.program);
      throw new Error('Cannot allocate buffer');
    }
    this.buffer = buffer;
    try {
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      this.position = gl.getAttribLocation(this.program, 'position');
      this.uniforms = Object.fromEntries(
        [
          'resolution',
          'time',
          'pointer',
          'intensity',
          'palette',
          'camera',
          'satelliteCount',
          'orbitalDistance',
          'eventKind',
          'eventPhase',
          'earthDay',
          'earthNight',
          'earthClouds',
          'fox',
        ].map((name) => [name, gl.getUniformLocation(this.program, name)]),
      );
      if (cinematic) {
        this.finishProgram = compileProgram(gl, CINEMATIC_FINISH);
        this.finishPosition = gl.getAttribLocation(this.finishProgram, 'position');
        this.finishUniforms = Object.fromEntries(
          ['scene', 'resolution', 'texel'].map((name) => [
            name,
            gl.getUniformLocation(this.finishProgram!, name),
          ]),
        );
        this.texture = gl.createTexture() || undefined;
        this.framebuffer = gl.createFramebuffer() || undefined;
        if (!this.texture || !this.framebuffer) throw new Error('Cannot allocate scene buffer');
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        this.allocateTexture();
      }
      if (scene === 'abyssal-bloom') {
        this.loadAsset('earthDay', 'images/space/earth-day.webp');
        this.loadAsset('earthNight', 'images/space/earth-night.webp');
        this.loadAsset('earthClouds', 'images/space/earth-clouds.webp');
      }
      if (scene === 'neon-city') this.loadAsset('fox', 'fox.png');
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  private loadAsset(uniform: string, path: string): void {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) throw new Error('Cannot allocate scene image');
    const image = new Image();
    this.assets.push({ texture, uniform, image });
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([0, 0, 0, 255]),
    );
    image.onload = () => {
      if (this.disposed) return;
      try {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        this.draw();
      } catch {
        this.assetFailed();
      }
    };
    image.onerror = () => {
      if (!this.disposed) this.assetFailed();
    };
    image.src = new URL(path, document.baseURI).href;
  }

  private allocateTexture(): void {
    if (!this.texture || !this.framebuffer) return;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.canvas.width,
      this.canvas.height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
      throw new Error('Scene framebuffer is incomplete');
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  setQuality(quality: RenderQuality): void {
    this.quality = quality;
    this.adaptive.reset();
    this.resize();
  }

  resize(): void {
    if (this.disposed) return;
    const rect = this.canvas.getBoundingClientRect();
    const [width, height] = drawingSize(
      rect.width,
      rect.height,
      window.devicePixelRatio || 1,
      this.quality,
      this.adaptive.scale,
    );
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.allocateTexture();
    }
    this.draw();
  }

  setActive(active: boolean): void {
    if (this.disposed || this.active === active) return;
    this.active = active;
    this.previous = 0;
    if (active) this.frame = requestAnimationFrame(this.tick);
    else {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  reset(): void {
    this.elapsed = 12;
    this.events = new SceneEvents();
    this.pointer = { x: 0, y: 0 };
    this.draw();
  }

  private bind(program: WebGLProgram, position: number): void {
    const gl = this.gl;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  }

  draw(): void {
    if (this.disposed) return;
    const gl = this.gl;
    if (this.framebuffer) gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.bind(this.program, this.position);
    gl.uniform2f(this.uniforms['resolution'], this.canvas.width, this.canvas.height);
    gl.uniform2f(this.uniforms['pointer'], this.pointer.x, this.pointer.y);
    gl.uniform1f(this.uniforms['time'], this.elapsed);
    gl.uniform1f(this.uniforms['intensity'], this.intensity);
    gl.uniform1f(this.uniforms['palette'], this.palette);
    gl.uniform1f(this.uniforms['camera'], this.camera);
    gl.uniform1f(this.uniforms['satelliteCount'], this.satelliteCount);
    gl.uniform1f(this.uniforms['orbitalDistance'], this.orbitalDistance);
    gl.uniform1f(this.uniforms['eventKind'], this.events.kind);
    gl.uniform1f(this.uniforms['eventPhase'], this.events.phase);
    this.assets.forEach((asset, index) => {
      gl.activeTexture(gl.TEXTURE0 + index + 1);
      gl.bindTexture(gl.TEXTURE_2D, asset.texture);
      gl.uniform1i(this.uniforms[asset.uniform], index + 1);
    });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (this.finishProgram) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      this.bind(this.finishProgram, this.finishPosition);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture!);
      gl.uniform1i(this.finishUniforms['scene'], 0);
      gl.uniform2f(this.finishUniforms['resolution'], this.canvas.width, this.canvas.height);
      gl.uniform2f(this.finishUniforms['texel'], 1 / this.canvas.width, 1 / this.canvas.height);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  private readonly tick = (now: number): void => {
    if (!this.active || this.disposed) return;
    if (!this.previous || now - this.previous >= 1000 / 30) {
      const delta = this.previous ? now - this.previous : 0;
      this.events.advance(Math.min(delta / 1000, 1));
      this.elapsed += Math.min(delta / 1000, 0.1) * this.speed;
      this.previous = now;
      if (this.quality === 'auto' && delta > 0 && this.adaptive.observe(delta)) this.resize();
      else this.draw();
    }
    this.frame = requestAnimationFrame(this.tick);
  };

  dispose(): void {
    if (this.disposed) return;
    this.setActive(false);
    this.disposed = true;
    this.gl.deleteBuffer(this.buffer);
    this.gl.deleteProgram(this.program);
    if (this.finishProgram) this.gl.deleteProgram(this.finishProgram);
    for (const asset of this.assets) {
      asset.image.onload = null;
      asset.image.onerror = null;
      this.gl.deleteTexture(asset.texture);
    }
    if (this.texture) this.gl.deleteTexture(this.texture);
    if (this.framebuffer) this.gl.deleteFramebuffer(this.framebuffer);
  }
}
