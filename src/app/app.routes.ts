import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: $localize`:@@route.homeTitle:Viacheslav Guzhov | Java, Spring Boot & AI Automation Engineer`,
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page.component').then((m) => m.HomePageComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
