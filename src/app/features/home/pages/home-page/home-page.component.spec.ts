import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HomePageComponent } from './home-page.component';

describe('HomePageComponent', () => {
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('creates the home page', () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    httpTestingController.expectOne('assets/content/en/all-in-one-page.md').flush('# About Me\n\nSummary text.');
    fixture.detectChanges();

    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the index card and sections from markdown', () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    httpTestingController.expectOne('assets/content/en/all-in-one-page.md').flush(
      '# About Me\n\nSummary text.\n\n## Intro\n\nHello.\n\n---\n\n# Contact\n\nReach out.\n\n- Email: [hello](mailto:hello@example.com)\n',
    );
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const indexLabel = element.querySelector('.home-page__index-label')?.textContent?.trim();
    const indexLinks = Array.from(element.querySelectorAll('.home-page__index-link-title')).map((node) =>
      node.textContent?.trim(),
    );
    const sections = Array.from(element.querySelectorAll('.home-page__section-card'));

    expect(indexLabel).toBe('Index');
    expect(indexLinks).toEqual(['About Me', 'Contact']);
    expect(sections).toHaveLength(2);
  });
});
