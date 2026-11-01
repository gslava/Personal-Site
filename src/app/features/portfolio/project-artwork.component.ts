import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnInit,
  PLATFORM_ID,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-project-artwork',
  templateUrl: './project-artwork.component.html',
  styleUrl: './project-artwork.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectArtworkComponent implements OnInit, OnChanges {
  @Input({ required: true }) slug = '';
  @Input({ required: true }) imageAlt = '';

  protected readonly revealed = signal(false);
  private readonly document = inject(DOCUMENT);
  private readonly destroy = inject(DestroyRef);
  private readonly platform = inject(PLATFORM_ID);
  private autoReveal: MediaQueryList | undefined;
  private timer: number | undefined;
  private imageLoaded = false;

  ngOnInit(): void {
    const windowRef = this.document.defaultView;
    if (!isPlatformBrowser(this.platform) || !windowRef?.matchMedia) return;

    this.autoReveal = windowRef.matchMedia('(hover: none), (pointer: coarse)');
    const update = () => this.updateAutoReveal();
    this.autoReveal.addEventListener('change', update);
    this.destroy.onDestroy(() => {
      this.clearTimer();
      this.autoReveal?.removeEventListener('change', update);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['slug']) {
      this.clearTimer();
      this.revealed.set(false);
      this.imageLoaded = false;
    }
  }

  protected onImageLoad(): void {
    this.imageLoaded = true;
    this.updateAutoReveal();
  }

  private updateAutoReveal(): void {
    this.clearTimer();
    if (!this.autoReveal?.matches) {
      this.revealed.set(false);
    } else if (this.imageLoaded && !this.revealed()) {
      this.timer = this.document.defaultView?.setTimeout(() => {
        this.timer = undefined;
        this.revealed.set(true);
      }, 1000);
    }
  }

  private clearTimer(): void {
    if (this.timer !== undefined) {
      this.document.defaultView?.clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
