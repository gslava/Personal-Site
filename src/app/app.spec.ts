import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideRouter, Router } from '@angular/router';
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
    const localeLinks = Array.from(compiled.querySelectorAll('.locale-switcher__link')).map(
      (link) => link.textContent?.trim(),
    );

    expect(homeButton).toBeTruthy();
    expect(homeIcon?.getAttribute('src')).toBe('images/fox-64.webp');
    expect(localeLinks).toEqual(['EN', 'DE', 'UK']);
    const primaryLinks = Array.from(compiled.querySelectorAll('#primary-navigation a')).map((a) =>
      a.getAttribute('href'),
    );
    expect(primaryLinks).toEqual(['/work', '/about', '/contact', 'cv/viacheslav-guzhov-cv.pdf']);
    expect(compiled.querySelector('.footer-links a[href="/experiments"]')).not.toBeNull();
  });
  it('keeps the legacy Experience URL usable and preserves its fragment', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/experience#work-experience');
    await fixture.whenStable();
    expect(router.url).toBe('/about#work-experience');
    expect(fixture.nativeElement.querySelector('#work-experience')).not.toBeNull();
  });
  it('opens the knowledge assistant case through the real route configuration', async () => {
    document.documentElement.lang = 'en';
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/work/company-knowledge-assistant');
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'Company Knowledge Assistant',
    );
    expect(fixture.nativeElement.querySelector('.case-summary')?.textContent).toContain('MCP');
    expect(fixture.nativeElement.querySelector('.next-project')?.getAttribute('href')).toBe(
      '/work/amazon-ads',
    );
  });
});
