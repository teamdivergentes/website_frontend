import { Routes } from '@angular/router';
import { MainLayout } from '../shared/layouts/main-layout/main-layout';
import { authGuard, noAuthGuard, pageVisibilityGuard, permissionGuard } from '../shared/guards';
import { unsavedChangesGuard } from './admin/shared/unsaved-changes.guard';

export const routes: Routes = [
  // Routes authentification (publiques)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        title: 'Connexion',
        canActivate: [noAuthGuard],
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
        path: 'roles/new',
        title: 'Nouveau role',
        canActivate: [permissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'roles:read' },
        loadComponent: () =>
          import('./admin/pages/roles/role-form-page.component').then(
            m => m.RoleFormPageComponent
          )
      },
      {
        path: 'roles/edit/:id',
        title: 'Modifier le role',
        canActivate: [permissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'roles:read' },
        loadComponent: () =>
          import('./admin/pages/roles/role-form-page.component').then(
            m => m.RoleFormPageComponent
          )
      },
      {
        path: 'teams',
        title: 'Gestion Equipes',
        canActivate: [permissionGuard],
        data: { permission: 'teams:read' },
        loadComponent: () => import('./admin/pages/teams/teams.component').then(m => m.TeamsComponent)
      },
      {
        path: 'teams/:id/members',
        title: 'Membres de l\'equipe',
        canActivate: [permissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'teams:read' },
        loadComponent: () =>
          import('./admin/pages/teams/team-members/team-members-page.component').then(
            m => m.TeamMembersPageComponent
          )
      },
      {
        path: 'teams/:id/coaching',
        title: 'Staff de coaching',
        canActivate: [permissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'teams:read' },
        loadComponent: () =>
          import('./admin/pages/teams/coaching-staff/coaching-staff-page.component').then(
            m => m.CoachingStaffPageComponent
          )
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
        path: 'sponsors/:id/images',
        title: 'Images du sponsor',
        canActivate: [permissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'sponsors:read' },
        loadComponent: () =>
          import('./admin/pages/sponsors/sponsor-images-page.component').then(
            m => m.SponsorImagesPageComponent
          )
      },
      {
        path: 'sponsors/:id/liens',
        title: 'Liens du sponsor',
        canActivate: [permissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'sponsors:read' },
        loadComponent: () =>
          import('./admin/pages/sponsors/sponsor-links-page.component').then(
            m => m.SponsorLinksPageComponent
          )
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
        path: 'recruitment/new',
        title: 'Nouvelle offre',
        canActivate: [permissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'recrutement:read' },
        loadComponent: () =>
          import('./admin/pages/recruitment/recruitment-form-page.component').then(
            m => m.RecruitmentFormPageComponent
          )
      },
      {
        path: 'recruitment/edit/:id',
        title: "Modifier l'offre",
        canActivate: [permissionGuard],
        canDeactivate: [unsavedChangesGuard],
        data: { permission: 'recrutement:read' },
        loadComponent: () =>
          import('./admin/pages/recruitment/recruitment-form-page.component').then(
            m => m.RecruitmentFormPageComponent
          )
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
        // De-imbrication du seul dialogue-dans-un-dialogue du panel : la liste
        // des categories s'ouvrait en modale par-dessus la liste des articles,
        // et ouvrait a son tour le formulaire de categorie.
        path: 'articles/categories',
        title: "Catégories d'articles",
        canActivate: [permissionGuard],
        data: { permission: 'articles:read' },
        loadComponent: () =>
          import('./admin/pages/articles/article-categories/article-categories-page.component').then(
            m => m.ArticleCategoriesPageComponent
          )
      },
      {
        path: 'articles/edit/:id',
        title: 'Modifier Article',
        canActivate: [permissionGuard],
        data: { permission: 'articles:read' },
        loadComponent: () => import('./admin/pages/articles/article-editor.component').then(m => m.ArticleEditorComponent)
      },
      {
        path: 'twitch-channels',
        title: 'Chaînes Twitch',
        canActivate: [permissionGuard],
        data: { permission: 'twitch_channels:read' },
        loadComponent: () =>
          import('./admin/pages/twitch-channels/twitch-channels.component').then(
            m => m.TwitchChannelsComponent
          )
      },
      {
        path: 'trophies',
        title: 'Palmarès',
        canActivate: [permissionGuard],
        data: { permission: 'trophies:read' },
        loadComponent: () =>
          import('./admin/pages/trophies/trophies-admin.component').then(
            m => m.TrophiesAdminComponent
          ),
      },
      {
        path: 'matches',
        title: 'Matchs',
        canActivate: [permissionGuard],
        data: { permission: 'matches:read' },
        loadComponent: () =>
          import('./admin/pages/matches/matches-admin.component').then(
            m => m.MatchesAdminComponent
          ),
      },
      {
        path: 'commandes',
        title: 'Commandes',
        canActivate: [permissionGuard],
        data: { permission: 'commandes:read' },
        loadComponent: () =>
          import('./admin/pages/commandes/commandes-admin.component').then(
            m => m.CommandesAdminComponent
          ),
      },
      {
        path: 'boutique',
        title: 'Boutique',
        canActivate: [permissionGuard],
        data: { permission: 'boutique:read' },
        loadComponent: () =>
          import('./admin/pages/boutique/boutique-admin.component').then(
            m => m.BoutiqueAdminComponent
          ),
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
        children: [
          {
            path: '',
            title: 'Boutique',
            loadComponent: () => import('./pages/boutique/boutique').then(m => m.BoutiqueComponent)
          },
          {
            path: 'panier',
            title: 'Votre panier',
            loadComponent: () =>
              import('./pages/boutique/panier/panier.component').then(m => m.PanierComponent)
          },
          {
            path: 'merci',
            title: 'Merci pour votre commande',
            loadComponent: () =>
              import('./pages/boutique/merci/merci.component').then(m => m.MerciComponent)
          },
          // En dernier : `:slug` capturerait sinon 'panier' et 'merci'.
          {
            path: ':slug',
            data: { shopBase: '/boutique' },
            loadComponent: () =>
              import('./pages/boutique/produit/produit.component').then(m => m.ProduitComponent)
          },
        ]
      },
      // ------------------------------------------------------------------
      // Variantes de liste, mises en ligne pour arbitrage.
      //
      // Seule la **liste** change d'une variante à l'autre. La fiche produit
      // est la même partout : `pages/boutique/produit`, montée trois fois avec
      // un rattachement différent. Elle en avait trois copies, ce qui obligeait
      // à porter chaque correction trois fois.
      //
      // `shopBase` dit à la fiche de quelle liste elle dépend : sans lui, un
      // visiteur venu de `/boutique3` repartirait sur `/boutique` au premier
      // clic sur le fil d'Ariane. `variantLabel` distingue les onglets pendant
      // la comparaison, `noIndex` évite que le même catalogue sous trois URL
      // ne se fasse concurrence sur les mêmes requêtes.
      //
      // Panier et confirmation ne sont pas redessinés : les variantes
      // renvoient vers ceux de `/boutique`, qui portent le même panier.
      //
      // A supprimer avec les dossiers `pages/boutique2` et `pages/boutique3`
      // une fois la décision prise, dans un sens ou dans l'autre.
      // ------------------------------------------------------------------
      {
        path: 'boutique2',
        children: [
          {
            path: '',
            title: 'Boutique (v2)',
            loadComponent: () =>
              import('./pages/boutique2/boutique2').then(m => m.Boutique2Component)
          },
          {
            path: ':slug',
            data: { shopBase: '/boutique2', variantLabel: 'v2', noIndex: true },
            loadComponent: () =>
              import('./pages/boutique/produit/produit.component').then(m => m.ProduitComponent)
          },
        ]
      },
      {
        path: 'boutique3',
        children: [
          {
            path: '',
            title: 'Boutique (v3)',
            loadComponent: () =>
              import('./pages/boutique3/boutique3').then(m => m.Boutique3Component)
          },
          {
            path: ':slug',
            data: { shopBase: '/boutique3', variantLabel: 'v3', noIndex: true },
            loadComponent: () =>
              import('./pages/boutique/produit/produit.component').then(m => m.ProduitComponent)
          },
        ]
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
            path: 'palmares',
            title: 'Palmarès',
            // Masquée par défaut (page_palmares_visible absent = false) : sans ce
            // guard, la page reste servie sur URL directe alors qu'aucun lien du
            // site n'y mène et qu'elle est exclue du sitemap.
            canActivate: [pageVisibilityGuard],
            data: { visibilityPath: '/structure/palmares' },
            loadComponent: () =>
              import('./pages/structure/palmares/palmares').then(m => m.PalmaresComponent),
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
          {
            path: 'equipes/:teamId/coach/:slug',
            title: 'Coach',
            loadComponent: () => import('./pages/equipes/coach-detail/coach-detail').then(m => m.CoachDetailComponent)
          },
        ]
      },
      // Page En Live
      {
        path: 'twitch',
        title: 'En live · Team Divergentes',
        loadComponent: () => import('./pages/twitch/twitch.component').then(m => m.TwitchComponent)
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
      // Page opt-out vie privée (Matomo)
      {
        path: 'privacy-optout',
        title: 'Préférences vie privée',
        loadComponent: () => import('./pages/privacy-optout/privacy-optout').then(m => m.PrivacyOptoutComponent)
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
      {
        path: 'conditions-generales-de-vente',
        title: 'Conditions Générales de Vente',
        loadComponent: () => import('./pages/legal/cgv/cgv').then(m => m.CgvComponent)
      },
      {
        path: 'retractation',
        title: 'Droit de rétractation',
        loadComponent: () =>
          import('./pages/legal/retractation/retractation').then(m => m.RetractationComponent)
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
