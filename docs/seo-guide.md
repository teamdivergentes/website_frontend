# Guide SEO — Ajout d'une page publique

Checklist et bonnes pratiques à appliquer à chaque nouvelle page **publique** (hors `/admin`, `/auth`, `/profile`).

> **Rappel architecture** : le site est une SPA Angular sans SSR. Nginx renvoie `index.html` avec HTTP 200 pour toute URL inconnue. Les headers SEO et le contenu doivent donc être gérés côté client via `SeoService` — sans discipline, chaque route crée un soft 404 potentiel aux yeux de Google.

---

## 1. Checklist minimale (à chaque nouvelle page)

- [ ] `SeoService.updateMetaTags({...})` appelé dans `ngOnInit` — **toujours**
- [ ] `title` renseigné (sera formaté en `"Page | Team Divergentes"`)
- [ ] `description` renseignée (150-160 caractères cible)
- [ ] `url` renseignée (canonique absolue générée automatiquement)
- [ ] `image` renseignée si la page a une visuel propre (Open Graph / Twitter Card)
- [ ] Route ajoutée dans `app.routes.ts` avec un `title` (fallback accessibilité)
- [ ] Entrée ajoutée dans `backend/src/sitemap/sitemap.service.ts` si la page est **statique et indexable**
- [ ] Tests mis à jour si sitemap modifié (`sitemap.service.spec.ts`)
- [ ] Gestion du **cas 404 backend** : `noIndex: true` sans redirect (cf. section 4)

## 2. Squelette de composant page

```ts
import { Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../shared/services/seo.service';

@Component({ /* ... */ })
export class MaPageComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Titre de la page',
      description: 'Description unique, 150-160 caractères, avec un mot-clé cible.',
      url: '/structure/ma-page',                  // relatif → préfixé automatiquement
      image: '/assets/img/ma-page/og.webp',       // optionnel, OG/Twitter
      type: 'website',                            // 'article' pour du contenu éditorial
    });

    // Optionnel : JSON-LD pour enrichir les résultats Google
    this.seoService.setJsonLd(this.seoService.getWebSiteJsonLd());
  }
}
```

## 3. Ajout au sitemap — obligatoire pour les pages indexables

### Page statique

Éditer `backend/src/sitemap/sitemap.service.ts` → constante `STATIC_PAGES` :

```ts
const STATIC_PAGES: StaticPage[] = [
  // ...
  { path: '/structure/ma-page', changefreq: 'monthly', priority: '0.6' },
];
```

Barème `priority` :

| Priority | Quand l'utiliser                              |
|---------:|-----------------------------------------------|
| `1.0`    | Accueil uniquement                            |
| `0.8-0.9`| Pages majeures (articles, équipes, structure) |
| `0.6-0.7`| Pages secondaires (boutique, recrutement)     |
| `0.3`    | Légal, mentions, CGU                          |

Barème `changefreq` : `daily` (news) → `weekly` (équipes, articles) → `monthly` (boutique) → `yearly` (légal).

### Page dynamique (entité BDD)

Ajouter un `findMany` dans `generateSitemapXml` et générer les entrées.
**⚠️ Règle d'or : l'URL dans le sitemap DOIT correspondre au paramètre réel de la route Angular.**

Exemple — route `/structure/equipes/:teamId` qui attend un **slug** :

```ts
// ❌ BUG — génère /structure/equipes/1 (numeric ID)
loc: `${normalizedBase}/structure/equipes/${team.id}`,

// ✅ OK — génère /structure/equipes/eva-joker (slug)
loc: `${normalizedBase}/structure/equipes/${team.slug}`,
```

> **Incident d'avril 2026** : le sitemap utilisait `team.id` alors que le front attend `team.slug`. Résultat : **0 pages dynamiques indexées sur 32 soumises** pendant ~3 mois.

## 4. Gérer le 404 "entité supprimée"

Quand l'API retourne 404 (équipe/joueur/article supprimé), **ne redirigez pas**. Affichez un état d'erreur en restant sur l'URL d'origine et ajoutez `noIndex: true`.

```ts
this.service.getBySlug(slug).subscribe({
  next: (entity) => { /* ... */ },
  error: () => {
    this.loading.set(false);
    this.error.set('Ressource introuvable');
    this.seoService.updateMetaTags({
      title: 'Ressource introuvable',
      description: "Cette ressource n'est plus référencée.",
      noIndex: true,   // ← critique : signale à Google de désindexer l'URL
    });
  },
});
```

**Pourquoi pas de redirect ?** Si on redirige vers `/structure/equipes` (une page qui existe), Google voit une page avec contenu → il garde l'ancienne URL en index comme "Submitted and indexed". Avec `noIndex` sur l'URL d'origine, Google la déréférence proprement au prochain crawl.

## 5. Robots, admin, zones privées

- **Jamais d'indexation** des routes sous `/admin/*`, `/auth/*`, `/profile` — déjà géré par `robots.txt` (`Disallow`) + header `X-Robots-Tag: noindex, nofollow` dans `nginx.conf` (locations `^~ /admin/`, `^~ /auth/`).
- Si une page publique ne doit PAS être indexée (sandbox, preview), passer `noIndex: true` dans `updateMetaTags`.
- `robots.txt` est généré au démarrage par `frontend/entrypoint.sh` selon la variable `ROBOTS_ALLOW`. En prod : `ROBOTS_ALLOW=true`.

## 6. URLs legacy — redirection 301

Quand une page change d'URL (ex : `/team` → `/structure/equipes`), **ajouter un redirect 301 dans `frontend/nginx.conf`** pour préserver le jus SEO :

```nginx
location = /ancienne-url { return 301 /nouvelle-url; }
```

Sans ça, Google continue d'indexer l'ancienne URL (HTTP 200 via fallback SPA) comme soft 404.

**Cas actuellement redirigés** (cf. `nginx.conf`) : `/team`, `/shop`, `/stream`, `/evenements`, `/graphic-chart`, `/twitch`, `/jeux`.

## 7. Canonical & domaine

- L'URL canonique est posée automatiquement par `SeoService.updateMetaTags({ url })` → `<link rel="canonical" href="https://teamdivergentes.fr/...">`.
- Le domaine canonique est `teamdivergentes.fr` (apex, sans `www`). Si du trafic `www` persiste, ajouter un redirect 301 `www → apex` au niveau infra (nginx ou Cloudflare).

## 8. Open Graph & Twitter Card

Les metas OG/Twitter sont posées par `SeoService.updateMetaTags({ image, type })` :
- `type: 'article'` pour les contenus éditoriaux (déclenche `article` Open Graph)
- `type: 'website'` par défaut pour le reste
- `image` : dimensions recommandées **1200×630px**, format WebP ou PNG, < 300 KB

## 9. JSON-LD (données structurées)

Utiliser les helpers du `SeoService` :

| Helper                                | Quand l'utiliser                        |
|---------------------------------------|-----------------------------------------|
| `getOrganizationJsonLd(socialUrls)`   | Homepage, page "structure"              |
| `getWebSiteJsonLd()`                  | Homepage (avec `SearchAction` optionnel)|
| `getSportsTeamJsonLd(name, game)`     | Page détail équipe                      |
| Schéma `Article` custom               | Page détail article (cf. `article-detail.component.ts`) |

**Ne pas oublier** : appeler `seoService.clearJsonLd()` dans `ngOnDestroy` si la page en pose, sinon les schémas persistent entre navigations SPA.

## 10. Vérifications avant merge

1. **Build** : `npx ng build --configuration=production` → pas d'erreur TypeScript
2. **Tests** : `npx jest` côté backend (sitemap) + `npx ng test --include="..."` côté front
3. **Inspecter la page** : après déploiement, utiliser Google Search Console → *Inspection d'URL* pour vérifier :
   - `coverageState: "Submitted and indexed"`
   - `robotsTxtState: "ALLOWED"`
   - `googleCanonical` = URL attendue
4. **Valider le sitemap** : `curl https://teamdivergentes.fr/sitemap.xml | grep <ta-route>`
5. **Lighthouse SEO ≥ 95** : `npx lighthouse https://teamdivergentes.fr/<route> --only-categories=seo`

## 11. Anti-patterns à bannir

| Anti-pattern                                             | Problème                                             |
|----------------------------------------------------------|------------------------------------------------------|
| `redirectTo: '404'` sur le wildcard                      | Perd l'URL originale dans GSC, masque les soft 404   |
| `router.navigate(['/404'])` sur erreur API               | Idem — préférer `noIndex: true` sur l'URL courante   |
| URL sitemap ≠ param route (slug vs id)                   | 0 indexation des entités dynamiques                  |
| Page publique sans appel à `updateMetaTags`              | Metas héritées de la page précédente (SPA)           |
| `<h1>` manquant ou multiple                              | Hiérarchie sémantique cassée                         |
| Images sans `alt`                                        | Accessibilité + SEO image                            |
| Contenu chargé uniquement après clic (lazy non crawlable)| Googlebot ne déclenche pas d'interaction             |
| Canonical différent par navigation (pas reset)           | Contamination inter-pages en SPA                     |

---

**Contact SEO** : l'agent `seo-expert` (scope `/frontend/` + Nginx) est le référent pour tout changement impactant l'indexation.
