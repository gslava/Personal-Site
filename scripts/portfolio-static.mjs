import { readFileSync } from 'node:fs';
const data = JSON.parse(
  readFileSync(new URL('../src/app/core/content/portfolio-content.json', import.meta.url), 'utf8'),
);
export const paths = [
  '',
  'work',
  'experience',
  'about',
  'contact',
  'experiments',
  ...data.en.projects.map((p) => 'work/' + p.slug),
  'experiments/particles',
  'experiments/interactive-particles',
  'experiments/neural-field',
  'experiments/service-constellation',
];
const routePaths = ['work', 'experience', 'about', 'experiments', 'contact'];
export const canonicalPath = (path) => (path === 'experience' ? 'about' : path);
const esc = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
export function pageInfo(locale, path) {
  const t = data[locale];
  path = canonicalPath(path);
  const project = t.projects.find((p) => 'work/' + p.slug === path);
  const index = routePaths.indexOf(path);
  const network = [t.networkFields.neural, t.networkFields.services].find(
    (scene) => path === 'experiments/' + scene.slug,
  );
  const title =
    network?.title ||
    (path === 'experiments/interactive-particles' ? t.imageParticles.title : '') ||
    project?.title ||
    (path === 'experiments/particles' ? t.particleTitle : index >= 0 ? t.nav[index] : t.role);
  const descriptions = {
    work: t.workIntro,
    about: t.about,
    contact: t.contactIntro,
    experiments: t.experimentIntro,
    'experiments/particles': t.particleIntro,
    'experiments/interactive-particles': t.imageParticles.intro,
  };
  return {
    title,
    description: network?.intro || project?.summary || descriptions[path] || t.intro,
  };
}
export function fallbackHtml(locale, path, base) {
  const t = data[locale],
    info = pageInfo(locale, path);
  path = canonicalPath(path);
  const link = (href, label) => '<a href="' + esc(href) + '">' + esc(label) + '</a>';
  const section = (title, body, id) =>
    '<section' +
    (id ? ' id="' + esc(id) + '"' : '') +
    '><h2>' +
    esc(title) +
    '</h2>' +
    body +
    '</section>';
  const paragraph = (text) => '<p>' + esc(text) + '</p>';
  const list = (items) =>
    '<ul>' + items.map((item) => '<li>' + esc(item) + '</li>').join('') + '</ul>';
  const cv =
    '<a href="' +
    esc(base + 'cv/viacheslav-guzhov-cv.pdf') +
    '" class="button button--secondary" download="Viacheslav Guzhov - CV.pdf">' +
    esc(t.cv) +
    '</a> ' +
    esc(t.cvNote);
  const project = t.projects.find((p) => 'work/' + p.slug === path);
  const projectList = () =>
    t.projects
      .filter((p) => path === 'work' || p.featured)
      .map((p) =>
        section(
          p.title,
          paragraph(path === 'work' ? p.summary : p.homeSummary) +
            paragraph(t.roleLabel + ': ' + p.contribution) +
            paragraph(p.stack.join(' / ')) +
            link(base + 'work/' + p.slug + '/', t.readCase),
        ),
      )
      .join('');
  const jobs = (detailed) =>
    t.jobs
      .map((j) =>
        section(
          j.title,
          paragraph(j.company + ' / ' + j.date + ' / ' + j.place) +
            (detailed
              ? '<ul>' +
                j.bullets
                  .map((bullet, i) => {
                    const [before, after] = bullet.split(j.bulletHighlights[i]);
                    return (
                      '<li>' +
                      esc(before) +
                      '<strong>' +
                      esc(j.bulletHighlights[i]) +
                      '</strong>' +
                      esc(after) +
                      '</li>'
                    );
                  })
                  .join('') +
                '</ul>'
              : paragraph(j.summary)),
        ),
      )
      .join('');
  let body = '';
  const network = [t.networkFields.neural, t.networkFields.services].find(
    (scene) => path === 'experiments/' + scene.slug,
  );
  if (!path)
    body =
      '<p>' +
      esc(t.heroFocus) +
      '<br>' +
      esc(t.heroBackend) +
      '</p>' +
      paragraph(t.intro) +
      paragraph(t.location + ' / ' + t.permit) +
      paragraph(t.languageItems.slice(0, 2).join(' / ')) +
      cv +
      section(t.featured, projectList()) +
      section(t.experienceTitle, jobs(false)) +
      link(base + 'about/', t.aboutLink);
  else if (path === 'work')
    body =
      paragraph(t.workIntro) +
      projectList() +
      section(
        t.more,
        t.additional.map((p) => section(p[0], paragraph(p[1]) + paragraph(p[2]))).join(''),
      );
  else if (project)
    body =
      paragraph(project.summary) +
      paragraph(project.stack.join(' / ')) +
      (project.relatedSlugs.length
        ? '<nav aria-label="' +
          esc(t.projectConnections) +
          '">' +
          paragraph(t.projectConnections) +
          list(
            project.relatedSlugs.map((slug) =>
              link(base + 'work/' + slug + '/', t.projects.find((p) => p.slug === slug).title),
            ),
          ) +
          '</nav>'
        : '') +
      section(
        t.caseSummaryTitle,
        project.snapshot
          .map((item, i) => section(t.caseSummaryLabels[i], paragraph(item)))
          .join(''),
      ) +
      '<figure><img class="static-experiment-preview" src="' +
      esc(base + 'images/projects/' + project.slug + '.webp') +
      '" alt="' +
      esc(project.imageAlt) +
      '" width="1536" height="1024"><figcaption>' +
      esc(t.illustrationNote) +
      '</figcaption></figure>' +
      section(
        t.workflowTitle,
        '<ol>' +
          project.workflow.map((step) => '<li>' + esc(step) + '</li>').join('') +
          '</ol>' +
          paragraph(t.workflowNote),
      ) +
      project.sections.map((s, i) => section(t.caseLabels[i], paragraph(s))).join('');
  else if (path === 'about')
    body =
      paragraph(t.about) +
      cv +
      '<nav aria-label="' +
      esc(t.sectionNavigation) +
      '">' +
      [
        ['work-experience', t.experienceTitle],
        ['technologies', t.capabilities],
        ['education', t.education],
        ['languages', t.languages],
      ]
        .map(([id, label]) => link(base + 'about/#' + id, label))
        .join(' ') +
      '</nav>' +
      section(t.experienceTitle, jobs(true) + link(base + 'work/', t.allWork), 'work-experience') +
      section(
        t.capabilities,
        t.capabilityItems.map((group) => section(group.title, list(group.items))).join(''),
        'technologies',
      ) +
      section(
        t.education,
        t.degrees
          .map((d, i) =>
            paragraph(d + ' / ' + t.university + ' / ' + (i === 0 ? '2022 - 2024' : '2007 - 2011')),
          )
          .join(''),
        'education',
      ) +
      section(t.languages, list(t.languageItems), 'languages');
  else if (path === 'experiments')
    body =
      paragraph(t.experimentIntro) +
      section(
        t.particleTitle,
        paragraph(t.particleIntro) + link(base + 'experiments/particles/', t.openExperiment),
      ) +
      section(
        t.imageParticles.title,
        paragraph(t.imageParticles.intro) +
          link(base + 'experiments/interactive-particles/', t.openExperiment),
      ) +
      [t.networkFields.neural, t.networkFields.services]
        .map((scene) =>
          section(
            scene.title,
            paragraph(scene.intro) +
              link(base + 'experiments/' + scene.slug + '/', t.openExperiment),
          ),
        )
        .join('') +
      section(
        t.monkShift.title,
        paragraph(t.monkShift.intro) + link(t.monkShift.url, t.monkShift.open),
      );
  else if (network)
    body =
      paragraph(network.intro) +
      '<img class="static-experiment-preview" src="' +
      esc(base + 'images/experiments/' + network.slug + '.webp') +
      '" alt="' +
      esc(network.title) +
      '" width="1158" height="709">' +
      paragraph(network.help) +
      paragraph(network.note) +
      paragraph(t.staticHelp) +
      link(base + 'experiments/', t.backExperiments);
  else if (path === 'experiments/interactive-particles')
    body =
      paragraph(t.imageParticles.intro) +
      ['fox', 'owl', 'jellyfish']
        .map((name, i) =>
          section(
            t.imageParticles.images[i],
            '<img class="static-experiment-preview" src="' +
              esc(base + 'images/particle-images/' + name + '.png') +
              '" alt="' +
              esc(t.imageParticles.images[i]) +
              '" width="640" height="640" loading="lazy">',
          ),
        )
        .join('') +
      paragraph(t.staticHelp) +
      link(base + 'experiments/', t.backExperiments);
  else if (path === 'experiments/particles')
    body =
      paragraph(t.particleIntro) +
      '<img class="static-experiment-preview" src="' +
      esc(base + 'images/experiments/particles.webp') +
      '" alt="' +
      esc(t.particleTitle) +
      '" width="1200" height="750">' +
      paragraph(t.staticHelp) +
      link(base + 'experiments/', t.backExperiments);
  else if (path === 'contact')
    body =
      paragraph(t.contactIntro) +
      link('mailto:guzhov.viacheslav@gmail.com', t.email) +
      section(
        t.elsewhere,
        link('https://www.linkedin.com/in/viacheslav-guzhov/', 'LinkedIn') +
          ' / ' +
          link('https://github.com/GSlava', 'GitHub') +
          ' / ' +
          cv,
      ) +
      section(
        t.messengers,
        link('https://t.me/g_slava', 'Telegram') +
          ' / ' +
          link('https://api.whatsapp.com/qr/NETY2M6VJROGA1', 'WhatsApp'),
      ) +
      paragraph(t.location + ' / ' + t.permit) +
      list(t.languageItems);
  else body = paragraph(t.intro);
  const contacts = section(
    t.nav[4],
    link('mailto:guzhov.viacheslav@gmail.com', t.email) +
      ' / ' +
      link('https://www.linkedin.com/in/viacheslav-guzhov/', 'LinkedIn') +
      ' / ' +
      link('https://github.com/GSlava', 'GitHub'),
  );
  const nav =
    link(base, t.home) +
    ' ' +
    [0, 2, 4].map((i) => link(base + routePaths[i] + '/', t.nav[i])).join(' ');
  return (
    '<div class="static-content container"><nav aria-label="' +
    esc(t.menu) +
    '">' +
    nav +
    '</nav><main id="static-main"><h1>' +
    esc(!path ? t.heroTitle : info.title) +
    '</h1>' +
    body +
    (path === 'contact' ? '' : contacts) +
    '</main><footer>' +
    link(base + 'experiments/', t.nav[3]) +
    '</footer></div>'
  );
}
