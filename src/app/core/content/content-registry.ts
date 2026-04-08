import contentRegistryJson from './content-registry.json';
import { SiteLocaleCode } from '../models/site-locale';
import { MarkdownPageKey } from './markdown-content.models';

type ContentRegistryEntry = {
  readonly labels: Record<SiteLocaleCode, string>;
};

type ContentRegistry = {
  readonly pages: Record<MarkdownPageKey, ContentRegistryEntry>;
};

export const CONTENT_REGISTRY = contentRegistryJson as ContentRegistry;

export function getContentPageLabel(pageKey: MarkdownPageKey, locale: SiteLocaleCode): string {
  return CONTENT_REGISTRY.pages[pageKey].labels[locale];
}
