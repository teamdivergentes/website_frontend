import { Routes } from '@angular/router';
import {MainLayout} from '../shared/layouts/main-layout/main-layout';

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
          path: '404',
          loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound)
        },
      ],
    },
    { path: '**', redirectTo: '404' }, // fallback
  ]
}];
