import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { PortfolioContentService, NAV_PATHS } from '../content/portfolio-content';
import { LocaleService } from './locale.service';

@Injectable({ providedIn: 'root' })
export class PageMetadataService {
  private readonly document = inject(DOCUMENT);
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly locale = inject(LocaleService);
  private readonly t = inject(PortfolioContentService).text;
  update(url: string): void {
    const path = url.split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
    const p = this.t.projects.find((p) => 'work/' + p.slug === path);
    const index = NAV_PATHS.findIndex((item) => item === path);
    const network = [this.t.networkFields.neural, this.t.networkFields.services].find(
      (scene) => path === 'experiments/' + scene.slug,
    );
    const name =
      network?.title ||
      (path === 'experiments/interactive-particles' ? this.t.imageParticles.title : '') ||
      p?.title ||
      (path === 'experiments/particles'
        ? this.t.particleTitle
        : index >= 0
          ? this.t.nav[index]
          : this.t.role);
    const descriptions: Record<string, string> = {
      work: this.t.workIntro,
      experience: this.t.experienceIntro,
      about: this.t.about,
      contact: this.t.contactIntro,
      experiments: this.t.experimentIntro,
      'experiments/particles': this.t.particleIntro,
      'experiments/interactive-particles': this.t.imageParticles.intro,
    };
    const description = network?.intro || p?.summary || descriptions[path] || this.t.intro;
    const site = 'https://gslava.github.io/Personal-Site/';
    const localized = (locale: string) =>
      site + (locale === 'en' ? '' : locale + '/') + (path ? path + '/' : '');
    const canonical = localized(this.locale.currentLocale());
    this.title.setTitle(name + ' | Viacheslav Guzhov');
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: name + ' | Viacheslav Guzhov' });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:image', content: site + 'images/viacheslav-guzhov.jpg' });
    this.meta.updateTag({ name: 'twitter:title', content: name + ' | Viacheslav Guzhov' });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: site + 'images/viacheslav-guzhov.jpg' });
    this.document.querySelector('link[rel="canonical"]')?.setAttribute('href', canonical);
    this.document.querySelectorAll('link[hreflang]').forEach((link) => {
      const lang = link.getAttribute('hreflang');
      link.setAttribute('href', localized(lang === 'de' || lang === 'uk' ? lang : 'en'));
    });
    const ld = this.document.querySelector('script[type="application/ld+json"]');
    if (ld?.textContent) {
      const schema = JSON.parse(ld.textContent);
      const page = schema['@graph']?.find(
        (item: Record<string, unknown>) =>
          item['@type'] === 'ProfilePage' || item['@type'] === 'WebPage',
      );
      if (page) {
        page['@type'] = path ? 'WebPage' : 'ProfilePage';
        page['@id'] = canonical + '#page';
        page.url = canonical;
        page.name = name;
      }
      ld.textContent = JSON.stringify(schema);
    }
  }
}
