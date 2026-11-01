import { inject, Injectable } from '@angular/core';
import { LocaleService } from '../services/locale.service';
import content from './portfolio-content.json';

type CinematicExperiment = {
  slug: string;
  title: string;
  intro: string;
  gesture: string;
  stack: string;
  detail: string;
  parameter: string;
  presets: string[];
  palettes: string[];
};
export type PortfolioContent = Omit<typeof content.en, 'cinematicExperiments'> & {
  cinematicExperiments: CinematicExperiment[];
};
export type Project = PortfolioContent['projects'][number];
export const NAV_PATHS = ['work', 'experience', 'about', 'experiments', 'contact'] as const;
@Injectable({ providedIn: 'root' })
export class PortfolioContentService {
  private readonly locale = inject(LocaleService);
  readonly text: PortfolioContent = content[this.locale.currentLocale()];
}
