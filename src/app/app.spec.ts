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
    const navLinks = Array.from(compiled.querySelectorAll('.site-nav__link')).map((link) =>
      link.textContent?.trim(),
    );
    const brandText = compiled.querySelector('.site-header__brand-text')?.textContent?.trim();
    const localeLinks = Array.from(compiled.querySelectorAll('.locale-switcher__link')).map((link) =>
      link.textContent?.trim(),
    );

    expect(brandText).toBe('HOME');
    expect(navLinks).toEqual(['Technologies', 'Projects', 'About Me', 'Contact']);
    expect(localeLinks).toEqual(['EN', 'DE', 'UK']);
  });
});
