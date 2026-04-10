import { marked } from 'marked';
import { SiteLocaleCode } from '../models/site-locale';
import {
  getContentPageLabel,
  getContentPageKeyByLabel,
  SINGLE_PAGE_SECTION_ORDER,
} from './content-registry';
import { SinglePageContent, SinglePageSection, SinglePageSectionKey } from './single-page-content.models';

marked.setOptions({
  gfm: true,
  breaks: false,
});

const BLOCK_SEPARATOR_PATTERN = /^\s*---\s*$/gm;
const INLINE_DIVIDER_PATTERN = /^\s*~+\s*$/gm;
const PARAGRAPH_BREAK_PATTERN = /\n\s*\n/g;
const TITLE_PATTERN = /^#{1,2}\s+(.+)$/m;
const HEADING_PATTERN = /^#{1,2}\s+(.+)$/gm;

export function parseSinglePageMarkdown(markdown: string, locale: SiteLocaleCode): readonly SinglePageSection[] {
  const usedIds = new Set<string>();
  const blocks = markdown
    .split(BLOCK_SEPARATOR_PATTERN)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks.map((block, index) => parseSinglePageBlock(block, locale, index, usedIds));
}

export function buildFallbackSinglePageContent(locale: SiteLocaleCode): SinglePageContent {
  const sections = SINGLE_PAGE_SECTION_ORDER.map((key) => {
    const title = getContentPageLabel(key, locale);
    const paragraph = getFallbackParagraph(locale, key);
    const markdown = `# ${title}\n\n${paragraph}`;

    return {
      key,
      id: key,
      title,
      summary: paragraph,
      html: renderMarkdown(markdown),
    };
  });

  return {
    locale,
    sections,
    usedFallback: true,
  };
}

function parseSinglePageBlock(
  blockMarkdown: string,
  locale: SiteLocaleCode,
  index: number,
  usedIds: Set<string>,
): SinglePageSection {
  const title = extractTitle(blockMarkdown, locale) ?? `Section ${index + 1}`;
  const key = getContentPageKeyByLabel(title, locale) ?? createFallbackKey(title);
  const id = createUniqueId(key, usedIds);

  return {
    key,
    id,
    title,
    summary: extractSummary(blockMarkdown),
    html: renderMarkdown(blockMarkdown),
  };
}

function extractTitle(markdown: string, locale: SiteLocaleCode): string | null {
  const headings = Array.from(markdown.matchAll(HEADING_PATTERN))
    .map((match) => match[1]?.trim())
    .filter((heading): heading is string => Boolean(heading));
  const knownSectionHeading = headings.find((heading) => getContentPageKeyByLabel(heading, locale));

  return knownSectionHeading ?? headings[0] ?? null;
}

function extractSummary(markdown: string): string {
  const markdownWithoutTitle = markdown.replace(TITLE_PATTERN, '').trim();
  const chunks = markdownWithoutTitle
    .split(PARAGRAPH_BREAK_PATTERN)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  const summaryChunk = chunks.find((chunk) => !isNonSummaryBlock(chunk));
  return summaryChunk ? stripInlineMarkdown(summaryChunk) : '';
}

function isNonSummaryBlock(chunk: string): boolean {
  return (
    chunk.startsWith('#') ||
    chunk.startsWith('- ') ||
    chunk.startsWith('* ') ||
    /^\d+\.\s/.test(chunk) ||
    chunk.startsWith('>') ||
    chunk.startsWith('|') ||
    chunk.startsWith('```') ||
    /^\s*~+\s*$/.test(chunk)
  );
}

function stripInlineMarkdown(value: string): string {
  return value
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    .replace(/[*_`>#~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function renderMarkdown(markdown: string): string {
  const rendered = marked.parse(
    markdown.replace(INLINE_DIVIDER_PATTERN, '\n<div class="content-inline-divider" aria-hidden="true"></div>\n'),
  );
  return typeof rendered === 'string' ? rendered : '';
}

function getFallbackParagraph(locale: SiteLocaleCode, key: SinglePageSectionKey): string {
  switch (locale) {
    case 'de':
      return getFallbackParagraphByKey(key, {
        'about-me': 'Dieser Abschnitt wird gerade vorbereitet.',
        'work-experience': 'Berufserfahrung wird hier zusammengefasst.',
        education: 'Ausbildung wird hier zusammengefasst.',
        technologies: 'Technologien und Werkzeuge werden hier zusammengeführt.',
        projects: 'Ausgewählte Projekte werden hier präsentiert.',
        contact: 'Kontaktinformationen werden hier angezeigt.',
      });
    case 'uk':
      return getFallbackParagraphByKey(key, {
        'about-me': 'Цей розділ зараз готується.',
        'work-experience': 'Тут буде зібрано досвід роботи.',
        education: 'Тут буде зібрана освіта.',
        technologies: 'Тут буде зібраний список технологій та інструментів.',
        projects: 'Тут будуть представлені вибрані проєкти.',
        contact: 'Тут будуть розміщені контактні дані.',
      });
    default:
      return getFallbackParagraphByKey(key, {
        'about-me': 'This section is being prepared.',
        'work-experience': 'Work experience will be summarized here.',
        education: 'Education will be summarized here.',
        technologies: 'Technologies and tools will be listed here.',
        projects: 'Selected projects will be presented here.',
        contact: 'Contact information will appear here.',
      });
  }
}

function getFallbackParagraphByKey(
  key: SinglePageSectionKey,
  paragraphs: Record<SinglePageSectionKey, string>,
): string {
  return paragraphs[key];
}

function createFallbackKey(title: string): string {
  return (
    title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section'
  );
}

function createUniqueId(base: string, usedIds: Set<string>): string {
  let nextId = base;
  let counter = 2;

  while (usedIds.has(nextId)) {
    nextId = `${base}-${counter}`;
    counter += 1;
  }

  usedIds.add(nextId);
  return nextId;
}
