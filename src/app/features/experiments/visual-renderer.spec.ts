import { afterEach, describe, expect, it, vi } from 'vitest';
import { VisualRenderer } from './visual-renderer';

function setup(compile = true) {
  const gl = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    COMPILE_STATUS: 3,
    LINK_STATUS: 4,
    ARRAY_BUFFER: 5,
    STATIC_DRAW: 6,
    FLOAT: 7,
    TRIANGLES: 8,
    TEXTURE_2D: 9,
    TEXTURE_MIN_FILTER: 10,
    TEXTURE_MAG_FILTER: 11,
    TEXTURE_WRAP_S: 12,
    TEXTURE_WRAP_T: 13,
    LINEAR: 14,
    CLAMP_TO_EDGE: 15,
    FRAMEBUFFER: 16,
    COLOR_ATTACHMENT0: 17,
    FRAMEBUFFER_COMPLETE: 18,
    RGBA: 19,
    UNSIGNED_BYTE: 20,
    TEXTURE0: 21,
    createTexture: vi.fn(() => ({})),
    createFramebuffer: vi.fn(() => ({})),
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    texImage2D: vi.fn(),
    bindFramebuffer: vi.fn(),
    framebufferTexture2D: vi.fn(),
    checkFramebufferStatus: vi.fn(() => 18),
    activeTexture: vi.fn(),
    uniform1i: vi.fn(),
    deleteTexture: vi.fn(),
    deleteFramebuffer: vi.fn(),
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderParameter: vi.fn(() => compile),
    getShaderInfoLog: vi.fn(() => 'compile failed'),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    createBuffer: vi.fn(() => ({})),
    useProgram: vi.fn(),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    getUniformLocation: vi.fn((_, name) => name),
    viewport: vi.fn(),
    uniform2f: vi.fn(),
    uniform1f: vi.fn(),
    drawArrays: vi.fn(),
    deleteShader: vi.fn(),
    deleteProgram: vi.fn(),
    deleteBuffer: vi.fn(),
  };
  const canvas = document.createElement('canvas');
  vi.spyOn(canvas, 'getContext').mockImplementation(
    (() => gl) as unknown as typeof canvas.getContext,
  );
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    width: 4000,
    height: 2400,
  } as DOMRect);
  return { gl, canvas };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('VisualRenderer lifecycle', () => {
  it('stops scheduling when paused and releases resources once on disposal', () => {
    const callbacks: FrameRequestCallback[] = [];
    const raf = vi.fn((callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    const cancel = vi.fn();
    vi.stubGlobal('requestAnimationFrame', raf);
    vi.stubGlobal('cancelAnimationFrame', cancel);
    const { canvas, gl } = setup();
    const renderer = new VisualRenderer(canvas, 'event-horizon');
    renderer.setActive(true);
    renderer.setActive(true);
    expect(raf).toHaveBeenCalledTimes(1);
    callbacks[0](100);
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
    renderer.setActive(false);
    expect(cancel).toHaveBeenCalledWith(2);
    callbacks[1](200);
    expect(raf).toHaveBeenCalledTimes(2);
    renderer.draw(); // A paused scene can still respond to settings.
    expect(gl.drawArrays).toHaveBeenCalledTimes(4);
    renderer.dispose();
    renderer.dispose();
    renderer.setActive(true);
    renderer.draw();
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(2);
    expect(gl.drawArrays).toHaveBeenCalledTimes(4);
  });

  it('caps large drawing buffers while preserving aspect ratio', () => {
    const { canvas } = setup();
    const renderer = new VisualRenderer(canvas, 'event-horizon');
    renderer.resize();
    expect(canvas.width).toBeLessThanOrEqual(1100);
    expect(canvas.height).toBeLessThanOrEqual(720);
    expect(canvas.width / canvas.height).toBeCloseTo(4000 / 2400, 2);
    renderer.dispose();
  });

  it('cleans up partially compiled shaders when initialization fails', () => {
    const { canvas, gl } = setup(false);
    expect(() => new VisualRenderer(canvas, 'event-horizon')).toThrow('compile failed');
    expect(gl.deleteShader).toHaveBeenCalledTimes(1);
    expect(gl.createProgram).not.toHaveBeenCalled();
  });

  it('renders both cinematic passes and releases all offscreen resources', () => {
    const { canvas, gl } = setup();
    const renderer = new VisualRenderer(canvas, 'event-horizon');
    renderer.resize();
    expect(gl.drawArrays).toHaveBeenCalledTimes(2);
    expect(gl.bindFramebuffer).toHaveBeenLastCalledWith(gl.FRAMEBUFFER, null);
    renderer.setQuality('performance');
    expect(canvas.width).toBeLessThan(800);
    renderer.dispose();
    renderer.dispose();
    expect(gl.deleteProgram).toHaveBeenCalledTimes(2);
    expect(gl.deleteTexture).toHaveBeenCalledTimes(1);
    expect(gl.deleteFramebuffer).toHaveBeenCalledTimes(1);
  });

  it('releases cinematic resources if the device rejects its framebuffer', () => {
    const { canvas, gl } = setup();
    gl.checkFramebufferStatus.mockReturnValue(0);
    expect(() => new VisualRenderer(canvas, 'neon-city')).toThrow(
      'Scene framebuffer is incomplete',
    );
    expect(gl.deleteProgram).toHaveBeenCalledTimes(2);
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteTexture).toHaveBeenCalledTimes(1);
    expect(gl.deleteFramebuffer).toHaveBeenCalledTimes(1);
  });

  it('releases local texture assets and ignores image completion after disposal', () => {
    const images: { onload: (() => void) | null; onerror: (() => void) | null; src: string }[] = [];
    vi.stubGlobal(
      'Image',
      class {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = '';
        constructor() {
          images.push(this);
        }
      },
    );
    const { canvas, gl } = setup();
    const failed = vi.fn();
    const renderer = new VisualRenderer(canvas, 'abyssal-bloom', failed);
    expect(images).toHaveLength(3);
    const complete = images[0].onload!;
    const failure = images[1].onerror!;
    renderer.dispose();
    const uploads = gl.texImage2D.mock.calls.length;
    complete();
    failure();
    expect(gl.texImage2D).toHaveBeenCalledTimes(uploads);
    expect(failed).not.toHaveBeenCalled();
    expect(gl.deleteTexture).toHaveBeenCalledTimes(4);
    expect(images.every((image) => image.onload === null && image.onerror === null)).toBe(true);
  });

  it('fails cleanly when WebGL is unavailable', () => {
    const canvas = document.createElement('canvas');
    vi.spyOn(canvas, 'getContext').mockReturnValue(null);
    expect(() => new VisualRenderer(canvas, 'event-horizon')).toThrow('WebGL is unavailable');
  });
});
