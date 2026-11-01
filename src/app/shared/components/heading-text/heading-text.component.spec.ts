import { TestBed } from '@angular/core/testing';
import { HeadingTextComponent } from './heading-text.component';

describe('HeadingTextComponent', () => {
  it('preserves readable localized text and updates every word on reused routes', async () => {
    const fixture = TestBed.createComponent(HeadingTextComponent);
    for (const text of [
      'Java Backend Developer',
      'Система управління запасами',
      'Automatisierte Auftragsverarbeitung',
    ]) {
      fixture.componentRef.setInput('text', text);
      await fixture.whenStable();
      expect(fixture.nativeElement.textContent).toBe(text);
      expect(fixture.nativeElement.querySelectorAll('.heading-word').length).toBe(
        text.split(' ').length,
      );
    }
  });
});
