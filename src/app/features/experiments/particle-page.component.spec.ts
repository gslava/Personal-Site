import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ParticleSphereComponent } from '../home/components/particle-sphere/particle-sphere.component';
import { ParticlePageComponent } from './particle-page.component';

@Component({ selector: 'app-particle-sphere', template: '' })
class StubParticleSphereComponent {}

describe('ParticlePageComponent', () => {
  let originalMatchMedia: PropertyDescriptor | undefined;

  beforeEach(async () => {
    document.documentElement.lang = 'en';
    originalMatchMedia = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }),
    });

    await TestBed.configureTestingModule({
      imports: [ParticlePageComponent],
      providers: [provideRouter([])],
    })
      .overrideComponent(ParticlePageComponent, {
        remove: { imports: [ParticleSphereComponent] },
        add: { imports: [StubParticleSphereComponent] },
      })
      .compileComponents();
  });

  afterEach(() => {
    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', originalMatchMedia);
    } else {
      Reflect.deleteProperty(window, 'matchMedia');
    }
  });

  it('starts playing with reduced motion set and lets the button pause and restart', () => {
    const fixture = TestBed.createComponent(ParticlePageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector('button') as HTMLButtonElement;

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.textContent).toContain('Pause animation');
    expect(element.querySelector('app-particle-sphere')).toBeTruthy();

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.textContent).toContain('Play animation');
    expect(element.querySelector('app-particle-sphere')).toBeNull();
    expect(element.querySelector('.static-cloud')).toBeTruthy();

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelector('app-particle-sphere')).toBeTruthy();
  });
});
