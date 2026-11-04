import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ProjectMotifComponent } from './project-motif.component';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { HeadingTextComponent } from '../../shared/components/heading-text/heading-text.component';
import { EntranceDirective } from '../../shared/directives/entrance.directive';
import { RuleRevealDirective } from '../../shared/directives/rule-reveal.directive';
import { PortfolioContentService } from '../../core/content/portfolio-content';
import { CopyEmailComponent } from '../../shared/components/copy-email/copy-email.component';
import { ProjectArtworkComponent } from './project-artwork.component';

@Component({
  selector: 'app-portfolio-page',
  imports: [
    RouterLink,
    ProjectMotifComponent,
    HeadingTextComponent,
    EntranceDirective,
    RuleRevealDirective,
    ProjectArtworkComponent,
    CopyEmailComponent,
  ],
  templateUrl: './portfolio-page.component.html',
  styleUrls: [
    './portfolio-details.scss',
    './portfolio-projects.scss',
    './portfolio-page.component.scss',
    './portfolio-experiments.scss',
    './portfolio-hierarchy.scss',
    './portfolio-editorial.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioPageComponent {
  protected readonly t = inject(PortfolioContentService).text;
  private readonly route = inject(ActivatedRoute);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  protected readonly page = computed(() => (this.data()['page'] as string) || 'home');
  protected readonly workGroups = [
    this.t.projects.filter(
      (p) => p.slug === 'inventory-management' || p.relatedSlugs.includes('inventory-management'),
    ),
    this.t.projects.filter(
      (p) => p.slug !== 'inventory-management' && !p.relatedSlugs.includes('inventory-management'),
    ),
  ];
  protected readonly visibleJobs = computed(() =>
    this.page() === 'home' ? this.t.jobs.slice(0, 2) : this.t.jobs,
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
