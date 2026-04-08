export type SiteLocaleCode = 'en' | 'de' | 'uk';

export interface SiteLocaleOption {
  readonly code: SiteLocaleCode;
  readonly label: string;
}
