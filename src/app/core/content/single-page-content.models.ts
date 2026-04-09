import { SiteLocaleCode } from '../models/site-locale';

export type SinglePageSectionKey =
  | 'about-me'
  | 'work-experience'
  | 'education'
  | 'technologies'
  | 'projects'
  | 'contact';

export interface SinglePageSection {
  readonly key: string;
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly html: string;
}

export interface SinglePageContent {
  readonly locale: SiteLocaleCode;
  readonly sections: readonly SinglePageSection[];
  readonly usedFallback: boolean;
}
