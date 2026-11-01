import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeadingTextComponent } from '../../shared/components/heading-text/heading-text.component';
import { EntranceDirective } from '../../shared/directives/entrance.directive';
import { RuleRevealDirective } from '../../shared/directives/rule-reveal.directive';
import { PortfolioContentService } from '../../core/content/portfolio-content';
import { ProjectArtworkComponent } from './project-artwork.component';

@Component({
  selector: 'app-portfolio-page',
  imports: [
    RouterLink,
    HeadingTextComponent,
    EntranceDirective,
    RuleRevealDirective,
    ProjectArtworkComponent,
  ],
  templateUrl: './portfolio-page.component.html',
  styleUrls: [
    './portfolio-details.scss',
    './portfolio-page.component.scss',
    './portfolio-experiments.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioPageComponent {
  protected readonly t = inject(PortfolioContentService).text;
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  protected readonly page = computed(() => (this.data()['page'] as string) || 'home');
  protected readonly visibleProjects = computed(() =>
    this.page() === 'home' ? this.t.projects.filter((p) => p.featured) : this.t.projects,
  );
  protected readonly project = computed(() =>
    this.t.projects.find((p) => p.slug === this.data()['slug']),
  );
  protected readonly connectedProjects = computed(() =>
    this.t.projects.filter((p) => this.project()?.relatedSlugs.includes(p.slug)),
  );
  protected readonly nextProject = computed(() => {
    const current = this.project();
    if (!current) return undefined;
    const index = this.t.projects.findIndex((p) => p.slug === current.slug);
    return this.t.projects[(index + 1) % this.t.projects.length];
  });
}
