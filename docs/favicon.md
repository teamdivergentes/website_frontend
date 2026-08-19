# Favicon

Le favicon suit le theme du **navigateur** (le reglage systeme relaye par
`prefers-color-scheme`), pas le theme du site : celui-ci est sombre en
permanence, alors que la barre d'onglets, elle, change de fond.

C'est ce qui rendait l'ancien favicon invisible. Il etait blanc sur fond
transparent : parfaitement lisible sur un onglet sombre, absent sur un onglet
clair, qui est le reglage par defaut de Windows et de macOS.

## Les fichiers

Tous dans `src/assets/logos/`.

| Fichier | Role |
|---------|------|
| `favicon.svg` | Les deux themes dans un seul fichier, via une media query interne |
| `favicon-32x32.png`, `favicon-16x16.png` | Repli, logo `#0C0D0C` pour onglet clair |
| `favicon-32x32-dark.png`, `favicon-16x16-dark.png` | Repli, logo blanc pour onglet sombre |
| `favicon.ico` | Repli ultime, 16/32/48, logo `#0C0D0C` |
| `apple-touch-icon.png` | 180x180, logo blanc aplati sur `#0C0D0C` |

Les sources livrees par le designer comptaient dix fichiers : cinq tailles fois
deux variantes. **Les cinq tailles portent le meme dessin** — seul le `viewBox`
change — et un SVG etant vectoriel, une seule suffit. Le `512x512` est le plus
precis, c'est lui qui produit `favicon.svg` ; les tailles intermediaires servent
a rasteriser les PNG au plus pres.

## Comment le theme est suivi

**Le SVG porte sa propre media query.** Le navigateur le traite comme un
document a part entiere, la regle CSS y est donc evaluee normalement :

```svg
<style>
  path { fill: #0C0D0C; }
  @media (prefers-color-scheme: dark) { path { fill: #fff; } }
</style>
```

Chrome, Edge et Firefox s'arretent la. **Safari, lui, n'accepte aucun favicon
SVG**, ni sur macOS ni sur iOS : il ignore le lien et prend le PNG suivant. Le
script de `index.html` echange donc les PNG a la main, sur `matchMedia`. Il
couvre du meme coup le changement de theme en cours de session, que Chromium ne
repercute pas toujours sur un favicon SVG deja peint.

Ce script ne s'execute jamais sous Node : le rendu serveur envoie la balise
telle quelle et seul le navigateur l'evalue. Aucune garde `isPlatformBrowser`
n'est donc necessaire — c'est le seul endroit du projet ou lire `window` sans
protection est correct.

Remplacer le `href` du lien ne suffit pas : Safari ne relit pas un lien d'icone
qu'il a deja traite. Le script remplace le noeud.

## L'attribut `media` sur `<link rel="icon">`

La specification HTML permet d'ecrire
`<link rel="icon" media="(prefers-color-scheme: dark)" ...>`. **Ne pas s'en
servir** : Chrome n'en tient pas compte pour arbitrer entre plusieurs icones, ce
qui donne un resultat correct sur Firefox et faux ailleurs.

## Regenerer les fichiers

Les PNG et l'`ico` sont derives des SVG sources. `scripts/generer-favicons.mjs`
refait le jeu complet :

```bash
node scripts/generer-favicons.mjs <dossier-des-svg-sources>
```

## Recette

Le rendu ne se verifie pas au screenshot : la barre d'onglets n'appartient pas a
la page. Basculer le theme du systeme et regarder l'onglet, sur Chrome ou Firefox
(chemin SVG) puis sur Safari (chemin PNG). Sur Chromium, un favicon SVG deja
peint peut demander un rechargement pour se mettre a jour.
