import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { PortfolioContentService } from '../../../core/content/portfolio-content';

@Component({
  selector: 'app-copy-email',
  template: `
    <button type="button" class="copy-email" [disabled]="copying()" (click)="copy()">
      {{ t.copyEmail }}
    </button>
    <span class="copy-status" role="status">{{ status() }}</span>
  `,
  styles: `
    :host {
      display: block;
      margin-top: 0.65rem;
    }
    .copy-email {
      min-height: 44px;
      padding: 0.4rem 0;
      border: 0;
      background: transparent;
      color: var(--accent);
      text-decoration: underline;
      text-underline-offset: 4px;
      font-size: 0.9rem;
    }
    .copy-email:disabled {
      cursor: wait;
    }
    .copy-status {
      display: block;
      max-width: 42ch;
      color: var(--secondary);
      font-size: 0.875rem;
      line-height: 1.5;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyEmailComponent {
  protected readonly t = inject(PortfolioContentService).text;
  private readonly document = inject(DOCUMENT);
  protected readonly status = signal('');
  protected readonly copying = signal(false);

  protected async copy(): Promise<void> {
    if (this.copying()) return;
    this.copying.set(true);
    this.status.set('');
    try {
      const clipboard = this.document.defaultView?.navigator.clipboard;
      if (!clipboard) throw new Error('Clipboard unavailable');
      await clipboard.writeText('guzhov.viacheslav@gmail.com');
      this.status.set(this.t.emailCopied);
    } catch {
      this.status.set(this.t.copyEmailFailed);
    } finally {
      this.copying.set(false);
    }
  }
}
