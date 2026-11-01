import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { PortfolioPageComponent } from './portfolio-page.component';

describe('PortfolioPageComponent', () => {
  it('links every case to the next localized project and wraps after the last', async () => {
    document.documentElement.lang = 'en';
    const data = new BehaviorSubject({ page: 'case', slug: 'inventory-management' });
    await TestBed.configureTestingModule({
      imports: [PortfolioPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { data, snapshot: { data: data.value } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PortfolioPageComponent);

    for (const [current, next] of [
      ['inventory-management', 'order-processing'],
      ['order-processing', 'company-knowledge-assistant'],
      ['company-knowledge-assistant', 'amazon-ads'],
      ['amazon-ads', 'product-content-creation'],
      ['product-content-creation', 'inventory-management'],
    ]) {
      data.next({ page: 'case', slug: current });
      fixture.detectChanges();
      const link = fixture.nativeElement.querySelector('.next-project') as HTMLAnchorElement;
      expect(link.getAttribute('href')).toBe(`/work/${next}`);
      expect(link.textContent).toContain('Next project');
      const summary = fixture.nativeElement.querySelector('.case-summary') as HTMLElement;
      expect(summary.querySelectorAll('article')).toHaveLength(3);
      expect(summary.textContent).toContain('My contribution');
      expect(fixture.nativeElement.querySelector('.case-metric')).toBeNull();
      const image = fixture.nativeElement.querySelector('.case-interface img') as HTMLImageElement;
      expect(image.getAttribute('src')).toBe(`images/projects/${current}.webp`);
      expect(image.getAttribute('srcset')).toContain(`${current}-768.webp 768w`);
      expect(image.getAttribute('alt')?.length).toBeGreaterThan(20);
      const connections = fixture.nativeElement.querySelector('.case-connections') as HTMLElement;
      if (['order-processing', 'company-knowledge-assistant'].includes(current)) {
        expect(connections.querySelector('a[href="/work/inventory-management"]')).not.toBeNull();
      } else if (current === 'inventory-management') {
        expect(connections.querySelectorAll('a')).toHaveLength(2);
      } else {
        expect(connections).toBeNull();
      }
      expect(fixture.nativeElement.querySelectorAll('.workflow li').length).toBeGreaterThanOrEqual(
        3,
      );
      const workflow = fixture.nativeElement.querySelector('.workflow') as HTMLElement;
      expect(
        summary.compareDocumentPosition(workflow) & Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
  });
});

// Home must remain a summary rather than a duplicate of the full profile.
describe('Employer-focused portfolio', () => {
  async function render(page: string) {
    document.documentElement.lang = 'en';
    const data = new BehaviorSubject({ page });
    await TestBed.configureTestingModule({
      imports: [PortfolioPageComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { data, snapshot: { data: data.value } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(PortfolioPageComponent);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows concise experience and a downloadable CV on Home without decorative images', async () => {
    const root = await render('home');
    expect(root.querySelector('h1')?.textContent).toBe('Java Backend Developer');
    expect(
      [...root.querySelectorAll('.hero__focus span')].map((line) => line.textContent?.trim()),
    ).toEqual(['AI automation & RAG', 'Java Spring Boot']);
    expect(root.querySelectorAll('.project-row')).toHaveLength(3);
    expect(root.querySelector('a[href="/work/company-knowledge-assistant"]')).not.toBeNull();
    expect(root.querySelector('a[href="/work/amazon-ads"]')).toBeNull();
    expect(root.querySelectorAll('.job-summary')).toHaveLength(2);
    expect(root.querySelector('.timeline ul')).toBeNull();
    expect(root.querySelector('img')).toBeNull();
    const cv = root.querySelector<HTMLAnchorElement>('a[download]');
    expect(cv?.getAttribute('href')).toBe('cv/viacheslav-guzhov-cv.pdf');
    expect(cv?.getAttribute('download')).toBe('Viacheslav Guzhov - CV.pdf');
    expect(root.querySelector('a[href="/#projects"]')).not.toBeNull();
  });

  it('combines full experience, illustrated avatar, AI skills, education and languages on About', async () => {
    const root = await render('about');
    expect(root.querySelectorAll('.timeline li')).toHaveLength(7);
    expect(root.querySelectorAll('.related-work a')).toHaveLength(5);
    expect(root.querySelector('.timeline .related-work')).toBeNull();
    expect(root.querySelector('.portrait')?.getAttribute('src')).toBe(
      'images/viacheslav-avatar.png',
    );
    expect(root.querySelector('#technologies')?.textContent).toContain('RAG');
    expect(root.querySelector('#technologies')?.textContent).toContain('Python');
    const groups = root.querySelectorAll('.capabilities article');
    expect(groups).toHaveLength(7);
    expect(groups[0].querySelector('h3')?.textContent).toBe('Programming languages');
    expect([...groups[0].querySelectorAll('li')].map((item) => item.textContent?.trim())).toEqual([
      'Java',
      'Python',
      'TypeScript',
      'JavaScript',
    ]);
    expect(groups[1].querySelector('h3')?.textContent).toBe('Backend');
    expect(groups[1].textContent).toContain('Spring Boot');
    expect(root.querySelector('.engineering-practice')).toBeNull();
    expect(root.querySelector('#about-me')?.textContent).not.toContain('Since 2024');
    expect(root.querySelector('#technologies')?.textContent).toContain('Vector databases');
    expect(root.querySelector('#education')?.textContent).toContain('English C1');
    expect(root.querySelector('#education')?.textContent).toContain('German B1');
  });

  it('keeps Particle Sphere first and includes interactive images', async () => {
    const root = await render('experiments');
    for (const slug of ['particles', 'interactive-particles']) {
      expect(root.querySelector('a[href="/experiments/' + slug + '"]')).not.toBeNull();
    }
    expect(root.querySelector('.cinematic-card')?.getAttribute('href')).toBe(
      '/experiments/particles',
    );
    for (const slug of [
      'galaxy',
      'flow',
      'terrain',
      'event-horizon',
      'neon-city',
      'abyssal-bloom',
    ]) {
      expect(root.querySelector('a[href="/experiments/' + slug + '"]')).toBeNull();
    }
    expect(root.querySelectorAll('.cinematic-card')).toHaveLength(5);
    for (const slug of ['neural-field', 'service-constellation']) {
      expect(root.querySelector('a[href="/experiments/' + slug + '"]')).not.toBeNull();
    }
    expect(root.querySelector('canvas')).toBeNull();
  });

  it('shows five cases on Work and promotes Product Content Creation from additional work', async () => {
    const root = await render('work');
    expect(root.querySelectorAll('.project-row')).toHaveLength(5);
    expect(root.querySelector('a[href="/work/amazon-ads"]')).not.toBeNull();
    expect(root.querySelector('a[href="/work/company-knowledge-assistant"]')).not.toBeNull();
    expect(root.querySelector('a[href="/work/product-content-creation"]')).not.toBeNull();
    expect(root.querySelectorAll('.more-projects article')).toHaveLength(5);
    expect(root.querySelector('.more-projects')?.textContent).not.toContain(
      'Product Content Creation',
    );
    expect(root.querySelectorAll('.project-role')).toHaveLength(5);
  });
});
