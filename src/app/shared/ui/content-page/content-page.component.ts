import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { MarkdownPageKey } from '../../../core/content/markdown-content.models';
import { MarkdownPageComponent } from '../markdown-page/markdown-page.component';

@Component({
  selector: 'app-content-page',
  imports: [MarkdownPageComponent],
  templateUrl: './content-page.component.html',
  styleUrl: './content-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly routePageKey = toSignal(
    this.route.data.pipe(map((data) => data['pageKey'] as MarkdownPageKey)),
    { initialValue: 'technologies' as MarkdownPageKey },
  );

  readonly pageKey = computed(() => this.routePageKey());
}
