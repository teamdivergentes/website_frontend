import { Routes } from '@angular/router';
import { MainLayout } from '../shared/layouts/main-layout/main-layout';
import { authGuard, permissionGuard } from '../shared/guards';

export const routes: Routes = [
  // Routes publiques (site vitrine)
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', loadComponent: () => import('./pages/home').then(m => m.Home) },
      {
        path: 'contact',
        title: 'Contact',
        loadComponent: () => import('./pages/contact/contact').then(m => m.ContactComponent)
      },
      {
        path: 'shop',
        title: 'Boutique',
        loadComponent: () => import('./pages/shop/shop').then(m => m.ShopComponent)
      },
      {
        path: 'structure/sponsors',
        title: 'Sponsors',
        loadComponent: () => import('./pages/sponsors/sponsors').then(m => m.SponsorComponent)
      },
      {
        path: 'structure',
        title: 'Structure',
        loadComponent: () => import('./pages/structure/structure').then(m => m.StructureComponent)
      },
      {
        path: 'structure/recrutement',
        title: 'Recrutement',
        loadComponent: () => import('./pages/recrutement/recrutement').then(m => m.RecrutementComponent)
      },
      {
        path: 'structure/equipes',
        title: 'Equipes & Ambassadeurs',
        loadComponent: () => import('./pages/equipes/equipes').then(m => m.EquipesComponent)
      },
      {
        path: 'structure/equipes/:teamId',
        title: 'Equipe',
        loadComponent: () => import('./pages/equipes/team-detail/team-detail').then(m => m.TeamDetailComponent)
      },
      {
        path: '404',
        loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound)
      },
    ],
  },

  // Routes authentification (publiques)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        title: 'Connexion',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        title: 'Inscription',
        loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // Routes admin (protegees)
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        title: 'Dashboard Admin',
        loadComponent: () => import('./admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        title: 'Gestion Utilisateurs',
        canActivate: [permissionGuard],
        data: { permission: 'users:read' },
        loadComponent: () => import('./admin/pages/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'roles',
        title: 'Gestion Roles',
        canActivate: [permissionGuard],
        data: { permission: 'roles:read' },
        loadComponent: () => import('./admin/pages/roles/roles.component').then(m => m.RolesComponent)
      },
      {
        path: 'teams',
        title: 'Gestion Equipes',
        canActivate: [permissionGuard],
        data: { permission: 'teams:read' },
        loadComponent: () => import('./admin/pages/teams/teams.component').then(m => m.TeamsComponent)
      },
      {
        path: 'sponsors',
        title: 'Gestion Sponsors',
        canActivate: [permissionGuard],
        data: { permission: 'sponsors:read' },
        loadComponent: () => import('./admin/pages/sponsors/sponsors.component').then(m => m.SponsorsComponent)
      },
      {
        path: 'config',
        title: 'Configuration',
        canActivate: [permissionGuard],
        data: { permission: 'config:read' },
        loadComponent: () => import('./admin/pages/config/config.component').then(m => m.ConfigComponent)
      },
    ]
  },

  // Fallback
  { path: '**', redirectTo: '404' }
];
