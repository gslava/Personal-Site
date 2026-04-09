import contentRegistryJson from './content-registry.json';
import { SiteLocaleCode } from '../models/site-locale';
import { SinglePageSectionKey } from './single-page-content.models';

type ContentRegistryEntry = {
  readonly labels: Record<SiteLocaleCode, string>;
};

type ContentRegistry = {
  readonly pages: Record<SinglePageSectionKey, ContentRegistryEntry>;
};

export const CONTENT_REGISTRY = contentRegistryJson as ContentRegistry;
export const SINGLE_PAGE_SECTION_ORDER = Object.keys(CONTENT_REGISTRY.pages) as SinglePageSectionKey[];

export function getContentPageLabel(pageKey: SinglePageSectionKey, locale: SiteLocaleCode): string {
  return CONTENT_REGISTRY.pages[pageKey].labels[locale];
}

export function getContentPageKeyByLabel(label: string, locale: SiteLocaleCode): SinglePageSectionKey | null {
  const normalizedLabel = normalizeLabel(label);

  for (const pageKey of SINGLE_PAGE_SECTION_ORDER) {
    if (normalizeLabel(CONTENT_REGISTRY.pages[pageKey].labels[locale]) === normalizedLabel) {
      return pageKey;
    }
  }

  return null;
}

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9а-яіїєґäöüß]+/giu, ' ')
    .trim();
}
