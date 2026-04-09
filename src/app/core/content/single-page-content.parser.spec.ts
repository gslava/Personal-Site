import { buildFallbackSinglePageContent, parseSinglePageMarkdown } from './single-page-content.parser';

describe('single-page-content.parser', () => {
  it('splits markdown into sections and extracts summaries', () => {
    const sections = parseSinglePageMarkdown(
      '# About Me\n\nSummary paragraph.\n\n## Details\n\nBody.\n\n---\n\n# Contact\n\nReach out here.\n',
      'en',
    );

    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({
      key: 'about-me',
      id: 'about-me',
      title: 'About Me',
      summary: 'Summary paragraph.',
    });
    expect(sections[1]).toMatchObject({
      key: 'contact',
      id: 'contact',
      title: 'Contact',
      summary: 'Reach out here.',
    });
  });

  it('builds localized fallback content for all sections', () => {
    const content = buildFallbackSinglePageContent('uk');

    expect(content.usedFallback).toBe(true);
    expect(content.sections).toHaveLength(6);
    expect(content.sections[0]?.title).toBeTruthy();
    expect(content.sections.every((section) => section.summary.length > 0)).toBe(true);
  });

  it('renders divider markers as inline divider elements', () => {
    const [section] = parseSinglePageMarkdown('# About Me\n\nIntro.\n\n~~\n\n## More\n\nBody.\n', 'en');

    expect(section?.html).toContain('content-inline-divider');
  });

  it('creates unique fallback ids for duplicate unknown titles', () => {
    const sections = parseSinglePageMarkdown('# Tech Stack\n\nOne.\n\n---\n\n# Tech Stack\n\nTwo.\n', 'en');

    expect(sections.map((section) => section.id)).toEqual(['tech-stack', 'tech-stack-2']);
  });
});
