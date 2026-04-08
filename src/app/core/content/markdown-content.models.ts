import { SiteLocaleCode } from '../models/site-locale';

export type MarkdownPageKey = 'technologies' | 'projects' | 'about-me' | 'contact';

export interface MarkdownPageContent {
  readonly html: string;
  readonly locale: SiteLocaleCode;
  readonly pageKey: MarkdownPageKey;
  readonly usedFallback: boolean;
}
