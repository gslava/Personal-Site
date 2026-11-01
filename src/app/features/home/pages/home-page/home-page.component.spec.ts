import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  beforeEach(async () => {
    document.documentElement.lang = 'en';
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });
  it('introduces the engineer, links to three cases and keeps the particle canvas off Home', () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('h1')?.textContent).toContain('Java Backend Developer');
    expect(element.textContent).toContain('connect AI to everyday operations');
    expect(element.querySelector('.metrics')).toBeNull();
    expect(element.querySelectorAll('.project-row')).toHaveLength(3);
    expect(element.querySelector('a[href="/work/inventory-management"]')).toBeTruthy();
    expect(element.querySelector('canvas')).toBeNull();
    expect(element.textContent).not.toMatch(/captcha/i);
  });
});
