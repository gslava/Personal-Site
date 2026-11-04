import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { NETWORK_FIELD_FACTORY, NetworkFieldPageComponent } from './network-field-page.component';

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  renderers: [] as {
    setRunning: ReturnType<typeof vi.fn>;
    setStrength: ReturnType<typeof vi.fn>;
    interact: ReturnType<typeof vi.fn>;
    endInteraction: ReturnType<typeof vi.fn>;
    pulse: ReturnType<typeof vi.fn>;
    resize: ReturnType<typeof vi.fn>;
    dispose: ReturnType<typeof vi.fn>;
  }[],
}));

function renderer() {
  const instance = {
    setRunning: vi.fn(),
    setStrength: vi.fn(),
    interact: vi.fn(),
    endInteraction: vi.fn(),
    pulse: vi.fn(),
    resize: vi.fn(),
    dispose: vi.fn(),
  };
  mocks.renderers.push(instance);
  return instance;
}

describe('NetworkFieldPageComponent', () => {
  beforeEach(() => {
    document.documentElement.lang = 'en';
    mocks.renderers.length = 0;
    mocks.create.mockReset().mockImplementation(async () => renderer());
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => {
    TestBed.resetTestingModule();
    vi.unstubAllGlobals();
  });

  async function setup(network = 'neural') {
    await TestBed.configureTestingModule({
      imports: [NetworkFieldPageComponent],
      providers: [
        provideRouter([]),
        { provide: NETWORK_FIELD_FACTORY, useValue: mocks.create },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { network } } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NetworkFieldPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }
  async function ready(fixture: Awaited<ReturnType<typeof setup>>) {
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.network-stage--ready')).toBeTruthy();
    });
  }
  it('uses the selected scene, toggles animation and cleans up the renderer', async () => {
    const fixture = await setup('services');
    await ready(fixture);
    expect(fixture.nativeElement.querySelector('select').value).toBe('1');
    expect(mocks.create.mock.calls[0][1]).toBe('services');
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Particle Clusters');
    const pause = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    pause.click();
    fixture.detectChanges();
    expect(pause.getAttribute('aria-pressed')).toBe('false');
    expect(mocks.renderers[0].setRunning).toHaveBeenLastCalledWith(false);
    pause.click();
    fixture.detectChanges();
    expect(mocks.renderers[0].setRunning).toHaveBeenLastCalledWith(true);
    fixture.destroy();
    expect(mocks.renderers[0].dispose).toHaveBeenCalledOnce();
  });
  it('starts with a static network for reduced motion and permits explicit play', async () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const fixture = await setup();
    await ready(fixture);
    expect(mocks.renderers[0].setRunning).toHaveBeenLastCalledWith(false);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.textContent).toContain('Play animation');
    button.click();
    expect(mocks.renderers[0].setRunning).toHaveBeenLastCalledWith(true);
  });
  it('supports keyboard pulses and replaces density without leaking the old field', async () => {
    const fixture = await setup();
    await ready(fixture);
    const canvas = fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(mocks.renderers[0].interact).toHaveBeenLastCalledWith({ x: 0.54, y: 0.5 });
    canvas.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(mocks.renderers[0].pulse).toHaveBeenLastCalledWith({ x: 0.54, y: 0.5 });
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = '2';
    select.dispatchEvent(new Event('change'));
    await ready(fixture);
    expect(mocks.renderers[0].dispose).toHaveBeenCalledOnce();
    expect(mocks.create.mock.calls[1][2]).toBe(2);
  });
  it('keeps fallback artwork visible if initialization fails', async () => {
    mocks.create.mockRejectedValueOnce(new Error('canvas unavailable'));
    const fixture = await setup();
    await vi.waitFor(() => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.status').textContent).toContain('unavailable');
    });
    expect(fixture.nativeElement.querySelector('.network-stage--ready')).toBeNull();
    expect(fixture.nativeElement.querySelector('img').getAttribute('src')).toContain(
      'neural-field.webp',
    );
  });
  it('destroys a field that finishes initializing after navigation away', async () => {
    let resolve!: (value: ReturnType<typeof renderer>) => void;
    mocks.create.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    const fixture = await setup();
    await vi.waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
    fixture.destroy();
    const pending = renderer();
    resolve(pending);
    await vi.waitFor(() => expect(pending.dispose).toHaveBeenCalledOnce());
  });
});
