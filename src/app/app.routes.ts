import { Routes } from '@angular/router';
import { MarkdownPageKey } from './core/content/markdown-content.models';

function buildContentRoute(path: string, title: string, pageKey: MarkdownPageKey) {
  return {
    path,
    title,
    data: { pageKey },
    loadComponent: () =>
      import('./shared/ui/content-page/content-page.component').then((m) => m.ContentPageComponent),
  };
}

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: $localize`:@@route.homeTitle:HOME`,
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page.component').then((m) => m.HomePageComponent),
  },
  buildContentRoute('technologies', $localize`:@@route.technologiesTitle:Technologies`, 'technologies'),
  buildContentRoute('projects', $localize`:@@route.projectsTitle:Projects`, 'projects'),
  buildContentRoute('about-me', $localize`:@@route.aboutTitle:About Me`, 'about-me'),
  buildContentRoute('contact', $localize`:@@route.contactTitle:Contact`, 'contact'),
  {
    path: '**',
    redirectTo: '',
  },
];
