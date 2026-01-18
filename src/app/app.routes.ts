import { Routes } from '@angular/router';
import { MainLayout } from '../shared/layouts/main-layout/main-layout';

export const routes: Routes = [{
  path: '',
  children: [
    {
      path: '',
      component: MainLayout,
      children: [
        { path: '', loadComponent: () => import('./pages/home').then(m => m.Home) },
        {
          path: 'shop',
          title: 'Boutique', loadComponent: () => import('./pages/shop/shop').then(m => m.ShopComponent)
        },
        {
          path: 'sponsors',
          title: 'Sponsors', loadComponent: () => import('./pages/sponsors/sponsors').then(m => m.SponsorComponent)
        },
        {
          path: 'test/fonts',
          title: 'Test Fonts',
          loadComponent: () => import('./test-fonts/test-fonts').then(m => m.TestFontsComponent)
        },
        {
          path: 'test/font',
          title: 'Font Test - Story 1.2',
          loadComponent: () => import('./components/font-test/font-test').then(m => m.FontTestComponent)
        },
        {
          path: 'test/buttons',
          title: 'Button Test - Story 1.3',
          loadComponent: () => import('./components/button-test/button-test').then(m => m.ButtonTestComponent)
        },
        {
          path: 'test/header-footer',
          title: 'Header/Footer Test - Story 1.4',
          loadComponent: () => import('./components/test/header-footer/header-footer-test').then(m => m.HeaderFooterTestComponent)
        },
        {
          path: 'test',
          title: 'Pages de Test',
          loadComponent: () => import('./components/test-index/test-index').then(m => m.TestIndexComponent)
        },
        {
          path: '404',
          loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound)
        },
      ],
    },
    { path: '**', redirectTo: '404' }, // fallback
  ]
}];
