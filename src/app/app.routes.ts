import { Routes } from '@angular/router';
import { MainLayout } from '../shared/layouts/main-layout/main-layout';
import { authGuard, permissionGuard } from '../shared/guards';

export const routes: Routes = [
  // Routes authentification (publiques)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        title: 'Connexion',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
      },
      // besoin de compte utilisateur ? jsp
      // {
      //   path: 'register',
      //   title: 'Inscription',
      //   loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent)
      // },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },

  // Route profil (protégée par authGuard)
  {
    path: 'profile',
    title: 'Mon Profil',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
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
        path: 'games',
        title: 'Gestion Jeux',
        canActivate: [permissionGuard],
        data: { permission: 'games:read' },
        loadComponent: () => import('./admin/pages/games/games.component').then(m => m.GamesComponent)
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
        loadComponent: () => import('./admin/pages/config/config-page.component').then(m => m.ConfigPageComponent)
      },
      {
        path: 'staff',
        title: 'Gestion Staff',
        canActivate: [permissionGuard],
        data: { permission: 'staff:read' },
        loadComponent: () => import('./admin/pages/staff/staff-list.component').then(m => m.StaffListComponent)
      },
      {
        path: 'recruitment',
        title: 'Gestion Recrutement',
        canActivate: [permissionGuard],
        data: { permission: 'recrutement:read' },
        loadComponent: () => import('./admin/pages/recruitment/recruitment.component').then(m => m.RecruitmentComponent)
      },
      {
        path: 'analytics',
        title: 'Analytics',
        canActivate: [permissionGuard],
        data: { permission: 'analytics:read' },
        loadComponent: () => import('./admin/pages/analytics/analytics-dashboard.component').then(m => m.AnalyticsDashboardComponent)
      },
      {
        path: 'articles',
        title: 'Gestion Articles',
        canActivate: [permissionGuard],
        data: { permission: 'articles:read' },
        loadComponent: () => import('./admin/pages/articles/articles-list.component').then(m => m.ArticlesListComponent)
      },
      {
        path: 'articles/new',
        title: 'Nouvel Article',
        canActivate: [permissionGuard],
        data: { permission: 'articles:read' },
        loadComponent: () => import('./admin/pages/articles/article-editor.component').then(m => m.ArticleEditorComponent)
      },
      {
        path: 'articles/edit/:id',
        title: 'Modifier Article',
        canActivate: [permissionGuard],
        data: { permission: 'articles:read' },
        loadComponent: () => import('./admin/pages/articles/article-editor.component').then(m => m.ArticleEditorComponent)
      },
    ]
  },

  // Routes publiques (site vitrine)
  {
    path: '',
    component: MainLayout,
    children: [
      { path: '', title: 'Accueil', loadComponent: () => import('./pages/home').then(m => m.Home) },
      {
        path: 'contact',
        title: 'Contact',
        loadComponent: () => import('./pages/contact/contact').then(m => m.ContactComponent)
      },
      {
        path: 'boutique',
        title: 'Boutique',
        loadComponent: () => import('./pages/boutique/boutique').then(m => m.BoutiqueComponent)
      },
      {
        path: 'structure',
        children: [
          {
            path: '',
            title: 'Structure',
            loadComponent: () => import('./pages/structure/structure').then(m => m.StructureComponent)
          },
          {
            path: 'sponsors',
            title: 'Sponsors',
            loadComponent: () => import('./pages/sponsors/sponsors').then(m => m.SponsorComponent)
          },
          {
            path: 'recrutement/postuler',
            title: 'Postuler',
            loadComponent: () => import('./pages/recrutement/application-form.component').then(m => m.ApplicationFormComponent)
          },
          {
            path: 'recrutement/:slug',
            title: 'Fiche de poste',
            loadComponent: () => import('./pages/recrutement/job-detail/job-detail.component').then(m => m.JobDetailComponent)
          },
          {
            path: 'recrutement',
            title: 'Recrutement',
            loadComponent: () => import('./pages/recrutement/recrutement').then(m => m.RecrutementComponent)
          },
          {
            path: 'equipes',
            title: 'Equipes & Ambassadeurs',
            loadComponent: () => import('./pages/equipes/equipes').then(m => m.EquipesComponent)
          },
          {
            path: 'equipes/:teamId',
            title: 'Equipe',
            loadComponent: () => import('./pages/equipes/team-detail/team-detail').then(m => m.TeamDetailComponent)
          },
          {
            path: 'equipes/:teamId/joueur/:playerSlug',
            title: 'Joueur',
            loadComponent: () => import('./pages/equipes/player-detail/player-detail').then(m => m.PlayerDetailComponent)
          },
        ]
      },
      // Articles
      {
        path: 'articles',
        title: 'Articles',
        loadComponent: () => import('./pages/articles/articles-page.component').then(m => m.ArticlesPageComponent)
      },
      {
        path: 'articles/:slug',
        title: 'Article',
        loadComponent: () => import('./pages/articles/article-detail/article-detail.component').then(m => m.ArticleDetailComponent)
      },
      // Pages légales
      {
        path: 'mentions-legales',
        title: 'Mentions Légales',
        loadComponent: () => import('./pages/legal/mentions-legales/mentions-legales').then(m => m.MentionsLegalesComponent)
      },
      {
        path: 'politique-de-confidentialite',
        title: 'Politique de Confidentialité',
        loadComponent: () =>
          import('./pages/legal/politique-confidentialite/politique-confidentialite').then(
            m => m.PolitiqueConfidentialiteComponent
          )
      },
      // Not Found — rendue directement sur l'URL originale (pas de redirect vers /404).
      // Préserve l'URL dans GSC et permet un diagnostic précis des soft 404.
      // La page applique <meta robots="noindex"> via SeoService.
      {
        path: '404',
        title: 'Page non trouvée',
        loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound)
      },
      {
        path: '**',
        title: 'Page non trouvée',
        loadComponent: () => import('./pages/not-found/not-found').then(m => m.NotFound)
      },
    ],
  },
];
