import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Decorative project metaphors, not product screens, architecture or measured data. */
@Component({
  selector: 'app-project-motif',
  host: { 'aria-hidden': 'true' },
  templateUrl: './project-motif.component.html',
  styleUrl: './project-motif.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMotifComponent {
  readonly variant = input.required<string>();
  protected readonly parts = [0, 1, 2, 3, 4, 5, 6, 7, 8];
}
