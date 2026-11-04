import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PortfolioContentService } from '../../../core/content/portfolio-content';
import content from '../../../core/content/portfolio-content.json';
import { CopyEmailComponent } from './copy-email.component';

describe('CopyEmailComponent', () => {
  const descriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  afterEach(() => {
    if (descriptor) Object.defineProperty(navigator, 'clipboard', descriptor);
    else Reflect.deleteProperty(navigator, 'clipboard');
  });

  async function render(clipboard: unknown) {
    document.documentElement.lang = 'en';
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
    await TestBed.configureTestingModule({
      imports: [CopyEmailComponent],
      providers: [{ provide: PortfolioContentService, useValue: { text: content.en } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(CopyEmailComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('copies the complete address and announces success only after writing', async () => {
    let finish!: () => void;
    const writeText = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const fixture = await render({ writeText });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();
    expect(writeText).toHaveBeenCalledWith('guzhov.viacheslav@gmail.com');
    expect(button.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toBe('');
    finish();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
      'Email copied',
    );
  });

  for (const [name, clipboard] of [
    ['unavailable', undefined],
    ['denied', { writeText: () => Promise.reject(new Error('Denied')) }],
  ] as const) {
    it(`offers manual copying when clipboard access is ${name}`, async () => {
      const fixture = await render(clipboard);
      fixture.nativeElement.querySelector('button').click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="status"]').textContent).toContain(
        'Select and copy',
      );
      expect(fixture.nativeElement.querySelector('button').disabled).toBe(false);
    });
  }
});
