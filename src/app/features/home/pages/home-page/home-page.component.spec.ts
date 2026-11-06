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
  it('introduces the engineer and confines decorative particles to the Work link', () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('h1')).toHaveLength(1);
    expect(element.querySelector('h1')?.textContent).toContain('Java Backend Developer');
    expect(element.textContent).toContain('internal web applications and AI automation');
    expect(element.querySelector('.metrics')).toBeNull();
    expect(element.querySelectorAll('.project-row')).toHaveLength(0);
    expect(element.querySelector('.work-portal a[href="/work"]')).toBeTruthy();
    expect(element.querySelector('.hero canvas')).toBeNull();
    expect(element.querySelector('app-particle-sphere')).toBeNull();
    expect(element.querySelectorAll('canvas')).toHaveLength(1);
    expect(element.querySelector('.work-portal app-project-motif canvas')).not.toBeNull();
    expect(element.textContent).not.toMatch(/captcha/i);
  });
});
