import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  Injector,
  input,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { PortfolioContentService } from '../../content/portfolio-content';
import { LocaleService } from '../../services/locale.service';

@Component({
  selector: 'app-locale-switcher',
  templateUrl: './locale-switcher.component.html',
  styleUrl: './locale-switcher.component.scss',
  host: {
    '(document:click)': 'onOutsideClick($event)',
    '(focusout)': 'onFocusOut($event)',
    '(keydown)': 'onKeydown($event)',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocaleSwitcherComponent {
  readonly popupId = input.required<string>();
  protected readonly t = inject(PortfolioContentService).text;
  private readonly localeService = inject(LocaleService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly options = viewChildren<ElementRef<HTMLAnchorElement>>('option');

  protected readonly links = computed(() => {
    this.router.lastSuccessfulNavigation();
    return this.localeService.localeLinks();
  });
  protected readonly activeIndex = computed(() => this.links().findIndex((link) => link.isActive));
  protected readonly activeLabel = computed(() => this.links()[this.activeIndex()]?.label);
  protected readonly open = signal(false);

  close(restoreFocus = false): void {
    if (!this.open()) return;
    this.open.set(false);
    if (restoreFocus) this.trigger().nativeElement.focus({ preventScroll: true });
  }

  protected toggle(): void {
    if (this.open()) {
      this.close(true);
      return;
    }
    this.open.set(true);
    afterNextRender(
      () => {
        if (this.open()) this.focusOption(Math.max(0, this.activeIndex()));
      },
      { injector: this.injector },
    );
  }

  protected onOutsideClick(event: MouseEvent): void {
    if (!event.composedPath().includes(this.host.nativeElement)) this.close();
  }

  protected onFocusOut(event: FocusEvent): void {
    if (!this.host.nativeElement.contains(event.relatedTarget as Node | null)) this.close();
  }

  protected onKeydown(event: KeyboardEvent): void {
    const options = this.options();
    const current = options.findIndex((option) => option.nativeElement === event.target);

    if (!this.open()) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.toggle();
      }
      return;
    }

    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        event.stopPropagation();
        this.close(true);
        break;
      case 'Tab':
        this.close(true);
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.focusOption((current + 1) % options.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusOption((current > 0 ? current : options.length) - 1);
        break;
      case 'Home':
        event.preventDefault();
        this.focusOption(0);
        break;
      case 'End':
        event.preventDefault();
        this.focusOption(options.length - 1);
        break;
      case ' ':
        if (current >= 0) {
          event.preventDefault();
          options[current].nativeElement.click();
        }
        break;
    }
  }

  private focusOption(index: number): void {
    this.options()[index]?.nativeElement.focus();
  }
}
