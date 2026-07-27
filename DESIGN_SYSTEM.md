# Design System DVG - Pages Publiques

Extraction du design system utilisé sur les pages publiques du site TeamDivergentes.

---

## 1. Palette de couleurs

### Couleurs principales

| Token SCSS | Token CSS | Valeur | Usage |
|---|---|---|---|
| `$green` | `--green` | `#32D299` | Accent principal, CTA, liens actifs, bordures focus |
| `$green-hover` | — | `#2ab886` | Hover sur boutons et liens verts |
| `$green-light` | — | `rgba(50, 210, 153, 0.15)` | Fond surligne, badge actif |
| `$green-subtle` | — | `rgba(50, 210, 153, 0.08)` | Fond hover subtil, glow |
| `$green-border` | — | `rgba(50, 210, 153, 0.1)` | Bordures vertes discrètes |

### Couleurs de fond (dark theme)

| Token SCSS | Token CSS | Valeur | Usage |
|---|---|---|---|
| `$dark-background` | `--darkBackground` | `#0C0D0C` | Fond principal (body) |
| `$light-black` | `--lightBlack` | `#101111` | Fond secondaire (cards, sections) |
| `$black` | `--black` | `#090909` | Fond le plus profond |
| `$dark-green` | `--darkGreen` | `#28413B` | Bordures, séparateurs |
| — | — | `rgba(12, 13, 12, 0.871)` | Fond semi-transparent (header, overlays) |

### Couleurs de texte

| Token SCSS | Token CSS | Valeur | Usage |
|---|---|---|---|
| `$white` | `--white` | `#FFFFFF` | Texte principal |
| `$gray` | `--gray` | `#D3D3D3` | Texte secondaire (legacy) |
| `$text-muted` | `--text-muted` | `#B3B7B7` | Texte secondaire (descriptions) — AA ~9:1 sur `#101111` |
| `$text-dim` | `--text-dim` | `#9A9E9E` | Texte le plus atténué (métas, dates) — AA ~6.7:1 sur `#101111` |
| `$border-subtle` | `--border-subtle` | `rgba(255, 255, 255, 0.07)` | Séparateurs/bordures discrets (teinte claire, pas de noir plat) |
| — | — | `rgba(255, 255, 255, 0.8)` | Corps de texte (pages légales) |
| — | — | `rgba(255, 255, 255, 0.3)` | Placeholder, texte très atténué |

> **Migration** : préférer `$text-muted` / `$text-dim` aux gris ad-hoc (`#888`, `#999`, `#aaa`). Ces valeurs sont remontées pour garantir WCAG AA (≥ 4.5:1) sur les fonds sombres.

### Couleurs d'état

| Token SCSS | Token CSS | Valeur | Usage |
|---|---|---|---|
| `$error` | — | `#f44336` | Erreur, suppression |
| `$error-light` | — | `rgba(244, 67, 54, 0.15)` | Fond message erreur |
| `$result-win` | `--result-win` | `#32D299` | Résultat de match — victoire (= `$green`) |
| `$result-loss` | `--result-loss` | `#EA6A6A` | Résultat de match — défaite (rouge remonté, AA ~4.9:1) |
| `$result-draw` | `--result-draw` | `#A8ADAD` | Résultat de match — nul (gris neutre) |
| `$status-info` | `--status-info` | `#56B7DF` | Badge statut « info / publié » (bleu) — décliné en `rgba(…, 0.14/0.4)` |
| `$status-warning` | `--status-warning` | `#D7AA25` | Badge statut « attente » (ambre) — décliné en `rgba(…, 0.14/0.4)` |

### Rang typographique podium (palmarès)

Aucun emoji médaille. Le rang est rendu en **Bebas Neue** dans une pastille arrondie
teintée, désaturée et cohérente dark. La teinte podium est portée en CSS via
l'attribut `aria-label` (`1re place` / `2e place` / `3e place`), le reste est neutre vert.

| Token SCSS | Valeur | Usage |
|---|---|---|
| `$rank-gold` | `#E8C976` | Pastille 1re place (or désaturé) — AA ~12:1 |
| `$rank-silver` | `#C8D0DA` | Pastille 2e place (argent froid) — AA ~12:1 |
| `$rank-bronze` | `#D69B6E` | Pastille 3e place (bronze chaud) — AA ~8:1 |

`placementLabel(n)` renvoie `« 1er / 2e / 3e / Top n »` (forme courte) ou
`« 1re place / 2e place / 3e place / Top n »` (forme longue, `withRank=true`).

### Filtre SVG

```css
--greenSVG: invert(100%) sepia(44%) saturate(3700%) hue-rotate(77deg) brightness(95%) contrast(71%);
```

Permet de colorer en vert des SVG via `filter` sans modifier le fichier source.

---

## 2. Typographie

### Familles de polices

| Police | Token CSS | Usage |
|---|---|---|
| **Bebas Neue** | `--font-bebas-neue` | Titres display, navigation, sections (`text-transform: uppercase`) |
| **Athiti** | `--font-Athiti` | Corps de texte, labels, UI (poids 200–700) |
| **Asar** | `--font-Asar` | Texte décoratif, descriptions, formulaire contact |
| **Bellota Text** | `--font-Bellota` | Usage alternatif (texte stylisé) |

### Hiérarchie typographique (pages publiques)

| Classe / Élément | Mobile | Tablet+ | Détails |
|---|---|---|---|
| `.title` (h1 sections) | `40px` | `53px` | Bebas Neue, uppercase |
| `.subtitle` | `11px` | `18px` | `letter-spacing: 0.31rem` |
| Titres légaux `.highlight` | `clamp(2.5rem, 6vw, 4.5rem)` | — | Gradient vert, background-clip text |
| Titres légaux `.title` | `clamp(2rem, 5vw, 3.5rem)` | — | `letter-spacing: 4px`, uppercase |
| Sections légales `h2` | `1.5rem` | — | Bebas Neue, vert, `letter-spacing: 2px` |
| Corps de texte | `1rem` | — | Athiti, `line-height: 1.7` |
| Chips / tags | `1.1rem` | — | Bebas Neue, `letter-spacing: 1px`, uppercase |
| Navigation desktop | `1rem` → `1.25rem` → `1.5rem` | — | Responsive selon breakpoint |
| Footer copyrights | `12px` | — | — |
| Footer liens légaux | `11px` | — | Gray, hover vert + underline |

### Polices globales (body)

```scss
body {
  font-family: var(--font-bebas-neue), serif;
  color: $white;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## 3. Breakpoints

| Nom | Variable SCSS | Valeur | Media Query |
|---|---|---|---|
| **Mobile** | `$breakpoint-mobile` | `599px` | `max-width: 599px` |
| **Tablet** | `$breakpoint-tablet` | `600px` | `min-width: 600px` |
| **Desktop** | `$breakpoint-desktop` | `1025px` | `min-width: 1025px` |
| **Large** | `$breakpoint-large` | `1280px` | `min-width: 1280px` |

### Mixins responsive

```scss
@mixin responsive-header-height {
  height: $header-height-mobile;          // 77px
  @media (min-width: $breakpoint-tablet) {
    height: $header-height-tablet;        // 117px
  }
}
```

---

## 4. Espacements & Conteneurs

### Conteneurs

| Classe | Max-width desktop | Max-width tablet | Padding |
|---|---|---|---|
| `.small-container` | `1350px` | `880px` | `0 26px` |
| `.medium-container` | `1475px` | `900px` | `0 26px` |
| `.big-container` | `1700px` | — | `0 26px` |

Tous les conteneurs : `margin: 0 auto; width: 100%;`

### Échelle d'espacement récurrente

| Taille | Valeur | Usage typique |
|---|---|---|
| `xs` | `4px` / `0.25rem` | Micro-gaps, padding icônes |
| `sm` | `8px` / `0.5rem` | Gaps composants, padding interne |
| `md` | `12px`–`16px` / `0.75rem`–`1rem` | Gaps sections, margin éléments |
| `lg` | `20px`–`24px` / `1.25rem`–`1.5rem` | Padding cartes, gaps sections |
| `xl` | `32px`–`40px` / `2rem`–`2.5rem` | Margin entre sections |
| `2xl` | `48px`–`60px` / `3rem`–`3.75rem` | Padding pages, séparation majeure |
| `3xl` | `80px`+ | Marges inter-sections de page |

### Tailles du header

| Token | Mobile | Tablet | Desktop |
|---|---|---|---|
| Hauteur header | `77px` | `117px` | — |
| Largeur zone logo | `126px` | `187px` | `223px` |
| Largeur logo SVG | `36px` | — | `51px` |

---

## 5. Border-radius

### Rayons tokenisés (source unique : `_variables.scss` → `--radius-*`)

| Token SCSS | Token CSS | Valeur | Usage |
|---|---|---|---|
| `$radius-sm` | `--radius-sm` | `8px` | Inputs, boutons secondaires, petites cartes, bandeaux |
| `$radius-md` | `--radius-md` | `10px` | Cartes standard, tableaux, items admin |
| `$radius-lg` | `--radius-lg` | `12px` | Cartes majeures, hero, dialogs |
| `$radius-xl` | `--radius-xl` | `20px` | Grands blocs (carousel homepage) |

> **Migration** : remplacer les `border-radius` en dur (`8/10/11/12px`) par ces tokens sur les composants concernés.

### Autres valeurs récurrentes

| Valeur | Usage |
|---|---|
| `50%` / `999px` | Cercles, pastilles rang (spinners, icônes sociales, bullets) |
| `50px` | Pilules (boutons CTA, chips, skeleton-pill) |
| `24px` | Cards grands (page contact, contenu légal) |
| `20px` | Carousel homepage (`$homepage-border-radius`) |
| `16px` | Cards channel, overlay mobile (fallback mobile légal) |
| `12px` | Cards standard, inputs contact, login card, dialogs |
| `10px` | Cards équipe, skeleton-card, items admin, team cards |
| `8px` | Inputs, boutons secondaires, skeleton base |
| `6px` | Boutons login, icônes boutons |

---

## 6. Ombres & Élévation

| Contexte | Valeur |
|---|---|
| Carte login | `0 10px 40px rgba(0, 0, 0, 0.2)` |
| Bouton CTA hover | `0 8px 25px rgba(50, 210, 153, 0.4), 0 0 50px rgba(50, 210, 153, 0.2)` |
| Bouton CTA normal | `0 4px 15px rgba(50, 210, 153, 0.3), 0 0 30px rgba(50, 210, 153, 0.1)` |
| Team card hover | `0 10px 40px rgba(50, 210, 153, 0.3)` |
| Channel card hover | `0 8px 30px rgba(50, 210, 153, 0.15)` |
| Drag preview (admin) | `0 8px 32px rgba(0, 0, 0, 0.4)` |
| Focus ring input | `0 0 0 3px rgba(50, 210, 153, 0.08-0.1)` |

### Overlays & Backdrop

| Contexte | Fond | Effet |
|---|---|---|
| Header mobile | `rgba(12, 13, 12, 0.871)` | `backdrop-filter: blur(7px)` |
| Cookie consent | `rgba(#101111, 0.97)` | `backdrop-filter: blur(10px)` |
| Modal shop | `rgba(#000, 0.8)` | — |
| CDK overlay | `rgba(0, 0, 0, 0.75)` | — |

---

## 7. Animations & Transitions

### Keyframes globales

```scss
// Spinner de chargement
@keyframes spin {
  to { transform: rotate(360deg); }
}

// Skeleton shimmer
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

// Défilement sponsors infini
@keyframes scroll-sponsors {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

// Gradient animé (titres)
@keyframes gradient-shift {
  0%, 100% { background-position: 0% center; }
  50%      { background-position: 100% center; }
}

// Apparition
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

// Apparition avec scale
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.5); }
  to   { opacity: 1; transform: scale(1); }
}

// Erreur vibration
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25%      { transform: translateX(-4px); }
  75%      { transform: translateX(4px); }
}
```

### Durées de transition standard

| Durée | Easing | Usage |
|---|---|---|
| `0.2s` | `ease` | Hover boutons, focus inputs, tabs, micro-interactions |
| `0.25s` | `ease` | Menu mobile fadeIn |
| `0.3s` | `ease` / `ease-in-out` | Hover textes, underline, cards, couleurs |
| `0.3s` | `cubic-bezier(0.4, 0, 0.2, 1)` | Boutons CTA, chips (Material easing) |
| `0.4s` | `ease` | Shake erreur, filtre grayscale |
| `0.5s` | `ease` / `ease-in-out` | FadeIn formulaire, logo hover |
| `0.6s` | cubic timing | Carousel slides |
| `0.8s` | `linear infinite` | Spinner rotation |
| `1.5s` | `ease-in-out infinite` | Skeleton shimmer |
| `3s` | `ease infinite` | Gradient-shift titre |
| `18s` | `linear infinite` | Défilement sponsors |

### Motion premium (palmarès)

| Élément | Easing | Détail |
|---|---|---|
| Easing « spring » | `cubic-bezier(0.34, 1.4, 0.64, 1)` | Hover cartes/lignes, transitions courtes (~0.25s) |
| Reveal cartes mosaïque | spring, `0.55s` | Cascade au montage (`animation-delay` par `nth-child`) |
| Reveal piloté scroll | spring | Amélioration progressive via `@supports (animation-timeline: view())` — compositor-driven, aucun JS, aucun `window.scroll` |

**Règles motion (non négociables) :**
- Animer uniquement `transform` / `opacity` (jamais layout).
- `@media (prefers-reduced-motion: reduce)` neutralise toute animation décorative
  (reveal, hover-lift, shimmer skeleton, `skeleton-pulse` admin).
- Zoneless : pas de zone.js ; les reveals reposent sur des mécanismes CSS/compositor
  (timelines de scroll natives), pas sur des écouteurs de scroll.

### Profondeur / élévation (hero palmarès)

- **Grain/noise** : SVG `feTurbulence` en data-uri, `opacity` très basse, `pointer-events: none`.
- **Radial-glow vert** derrière le titre (`::before`).
- **Watermark année** imposant (Bebas Neue), décalé en haut-droite sur mobile pour
  éviter le chevauchement avec le titre.
- **Ombres tintées** : `box-shadow` teinté vert (`rgba(50, 210, 153, …)`), jamais de noir plat.

---

## 8. Composants UI récurrents

### 8.1 Boutons

#### Bouton primaire (CTA)

```scss
.submit-btn, .btn-primary {
  padding: 16px 40px;
  background: linear-gradient(135deg, #32D299 0%, #2ab886 100%);
  color: #000;
  border: none;
  border-radius: 50px;
  font-family: 'Bebas Neue', sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 0 4px 15px rgba(50, 210, 153, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(50, 210, 153, 0.4);
  }
}
```

#### Bouton secondaire (outline)

```scss
.btn-postuler, .btn-secondary {
  border: 1px solid #24af7d;
  background: #101111;
  color: white;
  border-radius: 10px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #32d299;
    color: #32d299;
    background: rgba(50, 210, 153, 0.08);
    transform: translateY(-2px);
  }
}
```

#### Bouton cookie decline

```scss
.btn-decline {
  background: transparent;
  border: 1px solid rgba(#d3d3d3, 0.3);
  color: $gray;
  border-radius: 6px;
  padding: 0.5rem 1.25rem;

  &:hover {
    border-color: white;
    color: white;
  }
}
```

### 8.2 Cards

#### Card channel / contact

```scss
.card {
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(50, 210, 153, 0.15);
  border-radius: 16px–24px;
  padding: 24px–40px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(50, 210, 153, 0.4);
    background: rgba(0, 0, 0, 0.8);
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(50, 210, 153, 0.15);
  }
}
```

#### Card équipe

```scss
.team-card {
  width: 315px;
  height: 309px;
  border-radius: 10px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;

  .team-image {
    filter: grayscale(100%);
    transition: filter 0.4s ease;
  }

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 10px 40px rgba(50, 210, 153, 0.3);

    .team-image { filter: grayscale(0%); }
  }
}
```

#### Card page légale

```scss
.legal-content {
  background: rgba($black, 0.6);
  border: 1px solid rgba($green, 0.15);
  border-radius: 24px;
  padding: 48px;

  @media (max-width: $breakpoint-mobile) {
    padding: 24px 20px;
    border-radius: 16px;
  }
}
```

### 8.3 Chips / Tags

```scss
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-family: 'Bebas Neue', sans-serif;
  font-size: 1.1rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 255, 255, 0.8);
  background: transparent;
  border: 1px solid rgba(50, 210, 153, 0.25);
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.active {
    background: linear-gradient(135deg, #32D299, #2ab886);
    border-color: #32D299;
    color: #000;
    box-shadow: 0 4px 20px rgba(50, 210, 153, 0.3);
  }

  &:hover:not(.active) {
    border-color: rgba(50, 210, 153, 0.5);
    background: rgba(50, 210, 153, 0.08);
    transform: translateY(-2px);
  }
}
```

### 8.4 Inputs de formulaire

```scss
input, textarea, select {
  width: 100%;
  padding: 16px 20px;
  font-family: 'Asar', serif;
  font-size: 1rem;
  color: white;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
  }

  &:focus {
    border-color: #32D299;
    background: rgba(50, 210, 153, 0.05);
    box-shadow: 0 0 0 3px rgba(50, 210, 153, 0.1);
  }

  &.ng-invalid.ng-touched {
    border-color: #f44336;
    background: rgba(244, 67, 54, 0.05);
  }
}
```

#### Underline animée au focus

```scss
.input-focus-border {
  position: absolute;
  bottom: 0;
  left: 20px;
  right: 20px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #32D299, transparent);
  border-radius: 2px;
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

input:focus ~ .input-focus-border {
  transform: scaleX(1);
}
```

### 8.5 Texte avec hover (liens navigations)

```scss
.text-primary-hover {
  display: inline-block;
  position: relative;
  transition: all 0.3s ease-in-out;

  &:hover { color: var(--green); }

  &::after {
    content: "";
    display: block;
    width: 0;
    height: 1px;
    background-color: var(--green);
    position: absolute;
    bottom: 0;
    transition: width 0.3s ease-in-out;
  }

  &:hover::after { width: 80%; }
}
```

---

## 9. Skeleton Loading

### Classe de base

```scss
@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg,
    rgba($green, 0.06) 25%,
    rgba($green, 0.12) 50%,
    rgba($green, 0.06) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}
```

### Variantes

| Classe | Hauteur | Largeur | Border-radius |
|---|---|---|---|
| `.skeleton-text` | `16px` | `60%` | `8px` (hérité) |
| `.skeleton-title` | `32px` | `40%` | `8px` (hérité) |
| `.skeleton-title-lg` | `48px` | `50%` | `8px` (hérité) |
| `.skeleton-circle` | — | — | `50%` |
| `.skeleton-card` | — | — | `10px` |
| `.skeleton-pill` | — | — | `50px` |

### Spinner de chargement

```scss
.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba($green, 0.2);
  border-top-color: $green;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
```

### État de chargement / erreur

```scss
.loading-state, .error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: $white;
  gap: 1rem;

  p {
    font-family: 'Asar', serif;
    font-size: 18px;
  }
}
```

---

## 10. Gradients récurrents

### Linéaires

| Usage | Gradient |
|---|---|
| Bouton CTA | `linear-gradient(135deg, #32D299 0%, #2ab886 100%)` |
| Titre highlight | `linear-gradient(135deg, #32D299 0%, #6ee7b7 50%, #32D299 100%)` + `background-size: 200% auto` |
| Overlay image équipe | `linear-gradient(to bottom, rgba(16, 17, 17, 0) 50%, #101111 100%)` |
| Séparateur section | `linear-gradient(90deg, transparent, rgba(50, 210, 153, 0.3), transparent)` |
| Focus border input | `linear-gradient(90deg, transparent, #32D299, transparent)` |
| Login fond | `linear-gradient(135deg, #101111 0%, #111E1A 100%)` |

### Radiaux

| Usage | Gradient |
|---|---|
| Glow card (::before) | `radial-gradient(circle, rgba(50, 210, 153, 0.08) 0%, rgba(50, 210, 153, 0.03) 40%, transparent 70%)` + `filter: blur(20px)` |
| Main layout (::before) | Radial green (15%) at 25% 0% + radial green (8%) at 100% 50% |

---

## 11. Effets de hover

### Patterns récurrents

| Pattern | Propriétés | Usage |
|---|---|---|
| **Lift** | `transform: translateY(-2px à -8px)` | Cards, boutons, chips |
| **Scale** | `transform: scale(1.02 à 1.05)` | Images, structure dropdown |
| **Glow border** | `border-color: rgba($green, 0.4)` + `box-shadow` | Cards, inputs |
| **Color reveal** | `filter: grayscale(100%) → grayscale(0%)` | Images équipes, dropdown structure |
| **Underline grow** | `width: 0 → 80%` (pseudo-element) | Liens navigation |
| **Background shift** | `background: transparent → rgba($green, 0.08)` | Chips, boutons outline |
| **Logo color** | `fill: white → #00cc66` | Logo SVG hover |

---

## 12. Icônes

### Icônes SVG inline (composant `icon-svg`)

Types disponibles : `INSTAGRAM`, `TWITTER` (X), `YOUTUBE`, `DISCORD`, `TWITCH`, `MAIL`, `MENU`

- Taille par défaut : `24x24px`
- Couleur par défaut : `#FFFFFF`
- Accessibilité : `role="img"` + `<title>` sur chaque SVG

### Icônes sociales (composant `icon-link`)

```scss
.socials-icons_icon {
  border: 2px solid white;
  padding: 8px;
  border-radius: 50%;
}
```

Gaps responsive : `8px` (mobile) → `16px` (tablet) → `24px` (desktop)

### Material Icons

Utilisés uniquement dans la zone admin (`.mat-app`). `color: inherit` globalement.

---

## 13. Composant Slider / Carousel

### API

```typescript
images = input.required<SliderImage[]>()    // path, webpPath?, alt, width, height
autoPlayInterval = input<number>(5000)       // 0 = désactivé
showArrows = input<boolean>(true)
showDots = input<boolean>(true)
slideChange = output<number>()
```

### Hauteurs responsive

| Breakpoint | Hauteur slides |
|---|---|
| Mobile | `190px` |
| Tablet | `230px` |
| Desktop | `390px` |

### Indicateurs (dots)

```scss
span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--gray);       // inactif
  // Active : var(--white)
  // Hover non-actif : var(--green)
  transition: 0.2s;
}
```

---

## 14. Cookie Consent Banner

- Position : fixed bottom, z-index `9999`
- Fond : `rgba(#101111, 0.97)` + `backdrop-filter: blur(10px)`
- Bordure top : `1px solid rgba(#32D299, 0.3)`
- Max-width contenu : `1200px` centré
- Mobile : layout colonne, boutons full-width

---

## 15. Footer

### Layout

- **Mobile** : colonne unique
- **Tablet** : grid `220px + colonnes`
- **Desktop** : grid `450px auto 230px 316px`

### Éléments

- Logos : hashtag (`87x35px`) + DVG (`43x42px`)
- Icônes sociales en cercles (`2px solid white`, `8px padding`, `border-radius: 50%`)
- Copyrights : `12px`, séparateur `border-top: 1px solid $dark-green`
- Liens légaux : `11px`, gray, hover → vert + underline
- Navigation : `20px`, bordures gauche/droite `$dark-green`

---

## 16. Layout principal

### Structure

```
<app-header />              → Position fixe
<div #page-content>         → padding-top: header height
  <router-outlet />
</div>
<app-footer />              → Sticky bottom
<app-cookie-consent />      → Fixed bottom
```

### Fond décoratif

```scss
:host::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(ellipse at 25% 0%, rgba($green, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 100% 50%, rgba($green, 0.08) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}
```

---

## 17. Pages légales (mixin partagé)

### Structure

```
.legal-page > .legal-wrapper > .legal-header + .legal-content > .legal-section*
```

### Tokens

| Élément | Style |
|---|---|
| Page padding | `60px 20px 80px` |
| Wrapper max-width | `860px` |
| Header margin-bottom | `48px` |
| Content padding | `48px` (mobile: `24px 20px`) |
| Content border-radius | `24px` (mobile: `16px`) |
| Section margin-bottom | `36px` |
| Section h2 | Bebas Neue, `1.5rem`, vert, uppercase, `letter-spacing: 2px` |
| Section p | Athiti, `1rem`, `line-height: 1.7`, `rgba(white, 0.8)` |
| Liste bullets | `6x6px` cercle vert, `left: 0`, `padding-left: 20px` |

---

## 18. Accessibilité

### Patterns CSS

```scss
// Respect préférence mouvement réduit
@media (prefers-reduced-motion: reduce) {
  transition: none !important;
  animation: none !important;
}

// Focus visible clavier
&:focus-visible {
  outline: 2px solid var(--green);
  outline-offset: 2px;
}

// Touch target minimum
min-width: 44px;
min-height: 44px;
```

### Patterns HTML

- `role="img"` + `<title>` sur tous les SVG
- `target="_blank" rel="noopener noreferrer"` sur liens externes
- `aria-label` sur sections et éléments interactifs
- `aria-hidden="true"` sur icônes décoratives
- `role="status"` sur les états de chargement
- `role="dialog" aria-modal="true"` sur cookie banner
- Gestion du focus et support clavier (Escape pour fermer les menus)

---

## 19. Classes utilitaires globales

```scss
.pointer       { cursor: pointer; }
.d-flex        { display: flex; }
.flex-row      { display: flex; flex-direction: row; }
.align-center  { display: flex; align-items: center; }
.gap-16        { gap: 16px; }
.dark-primary  { color: $dark-green; }
.primary       { color: var(--green); }
.center        { text-align: center; }
```

---

## 20. Fichiers source du design system

| Fichier | Contenu |
|---|---|
| `src/styles/_variables.scss` | Couleurs, breakpoints, tailles |
| `src/styles/_text.scss` | Classes typographiques |
| `src/styles/_containers.scss` | Conteneurs avec max-width |
| `src/styles/_loading.scss` | Skeleton, spinners, états loading/error |
| `src/styles/_mixins.scss` | Mixins responsive (header, homepage) |
| `src/styles/_legal-shared.scss` | Mixin pages légales |
| `src/styles/_theme.scss` | Thème Material M3 (admin uniquement) |
| `src/styles/_material-overrides.scss` | Overrides composants Material (admin) |
| `src/styles/_admin-shared.scss` | Composants admin (formulaires, tables, etc.) |
| `src/styles.scss` | Point d'entrée, CSS custom properties, base, utilitaires |
