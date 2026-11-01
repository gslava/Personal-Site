import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home/pages/home-page/home-page.component';
const portfolio = () =>
  import('./features/portfolio/portfolio-page.component').then((m) => m.PortfolioPageComponent);
export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: { page: 'home' },
    // The entry page is critical-path content; avoid two serial chunk requests before its first paint.
    component: HomePageComponent,
  },
  { path: 'experience', redirectTo: 'about', pathMatch: 'full' },
  ...['work', 'about', 'contact', 'experiments'].map((page) => ({
    path: page,
    data: { page },
    loadComponent: portfolio,
  })),
  ...[
    'inventory-management',
    'order-processing',
    'company-knowledge-assistant',
    'amazon-ads',
    'product-content-creation',
  ].map((slug) => ({
    path: 'work/' + slug,
    data: { page: 'case', slug },
    loadComponent: portfolio,
  })),
  {
    path: 'experiments/particles',
    loadComponent: () =>
      import('./features/experiments/particle-page.component').then((m) => m.ParticlePageComponent),
  },
  {
    path: 'experiments/interactive-particles',
    loadComponent: () =>
      import('./features/experiments/particle-image-page.component').then(
        (m) => m.ParticleImagePageComponent,
      ),
  },
  ...[
    { slug: 'neural-field', network: 'neural' },
    { slug: 'service-constellation', network: 'services' },
  ].map(({ slug, network }) => ({
    path: 'experiments/' + slug,
    data: { network },
    loadComponent: () =>
      import('./features/experiments/network-field-page.component').then(
        (m) => m.NetworkFieldPageComponent,
      ),
  })),
  { path: '**', data: { page: 'not-found' }, loadComponent: portfolio },
];
