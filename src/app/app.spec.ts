import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the site shell navigation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const homeButton = compiled.querySelector('.site-header__home-button');
    const homeIcon = compiled.querySelector('.site-header__home-icon') as HTMLImageElement | null;
    const localeLinks = Array.from(compiled.querySelectorAll('.locale-switcher__link')).map((link) =>
      link.textContent?.trim(),
    );

    expect(homeButton).toBeTruthy();
    expect(homeIcon?.getAttribute('src')).toBe('fox.png');
    expect(localeLinks).toEqual(['EN', 'DE', 'UK']);
  });
});
