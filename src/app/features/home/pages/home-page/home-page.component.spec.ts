import { TestBed } from '@angular/core/testing';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
    }).compileComponents();
  });

  it('creates the home page', () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the fox overlay image', () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const fox = element.querySelector('.home-page__fox') as HTMLImageElement | null;

    expect(fox).toBeTruthy();
    expect(fox?.getAttribute('src')).toBe('fox.png');
  });
});
