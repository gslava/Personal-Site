import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { PortfolioContentService } from '../../../core/content/portfolio-content';

@Component({
  selector: 'app-copy-email',
  template: `
    <button
      type="button"
      class="copy-email"
      [attr.aria-label]="t.copyEmail"
      [title]="t.copyEmail"
      [attr.aria-disabled]="copying() ? 'true' : null"
      (click)="copy()"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        @if (copied()) {
          <path d="m5 12 4 4L19 6" />
        } @else {
          <rect x="4" y="4" width="12" height="12" rx="2" />
          <rect x="8" y="8" width="12" height="12" rx="2" class="copy-email__front" />
        }
      </svg>
    </button>
    <span class="copy-status" role="status">{{ status() }}</span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      position: relative;
    }
    .copy-email {
      display: grid;
      place-items: center;
      inline-size: 44px;
      block-size: 44px;
      padding: 0;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);
      color: var(--accent);
    }
    .copy-email svg {
      inline-size: 20px;
      block-size: 20px;
    }
    .copy-email__front {
      fill: var(--surface);
    }
    .copy-email:hover {
      border-color: var(--accent);
    }
    .copy-email:focus-visible {
      outline: 2px solid var(--accent);
      outline-offset: 3px;
    }
    .copy-email[aria-disabled='true'] {
      cursor: wait;
    }
    .copy-status {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyEmailComponent {
  protected readonly t = inject(PortfolioContentService).text;
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly status = signal('');
  protected readonly copied = signal(false);
  protected readonly copying = signal(false);
  private resetIcon?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.resetIcon));
  }

  protected async copy(): Promise<void> {
    if (this.copying()) return;
    clearTimeout(this.resetIcon);
    this.copying.set(true);
    this.copied.set(false);
    this.status.set('');
    try {
      const clipboard = this.document.defaultView?.navigator.clipboard;
      if (!clipboard) throw new Error('Clipboard unavailable');
      await clipboard.writeText('guzhov.viacheslav@gmail.com');
      if (this.destroyRef.destroyed) return;
      this.status.set(this.t.emailCopied);
      this.copied.set(true);
      this.resetIcon = setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.status.set(this.t.copyEmailFailed);
    } finally {
      this.copying.set(false);
    }
  }
}
