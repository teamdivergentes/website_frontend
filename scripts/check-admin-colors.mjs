#!/usr/bin/env node
/**
 * Verrou sur les couleurs de marque codees en dur dans le panel d'administration.
 *
 * L'audit du 2026-07-31 (EPIC-45) avait releve 525 valeurs de couleur en dur
 * dans `src/app/admin/`, pour 124 valeurs distinctes. La cause n'etait pas la
 * negligence : aucune reference n'existait, et chaque page devait donc trancher
 * seule. `ADMIN_DESIGN_SYSTEM.md` et `_admin-tokens.scss` comblent ce manque.
 *
 * Ce script empeche la derive de reprendre au premier ajout de page. Sans lui,
 * la migration se referait a chaque EPIC.
 *
 * Ce qui est interdit : les couleurs **de marque** et les couleurs **de role**,
 * sous toutes leurs graphies. Ce qui reste libre : les palettes categorielles
 * de graphiques et les couleurs d'une marque tierce qu'on reproduit — a
 * condition d'etre declarees ci-dessous.
 *
 * Lance par `npm run lint`, donc par la CI.
 */
import { readFileSync, globSync } from 'node:fs';
import { relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const ADMIN = 'src/app/admin';

/** Couleurs interdites, par famille. La cle sert au message d'erreur. */
const FORBIDDEN = [
  { rgb: [50, 210, 153], hex: ['32d299'], token: '--admin-accent', name: 'vert DVG' },
  { rgb: [40, 65, 59], hex: ['28413b'], token: '--admin-border-strong', name: 'vert sombre' },
  { rgb: [211, 211, 211], hex: ['d3d3d3'], token: '--admin-text-secondary', name: 'gris de charte' },
  { rgb: [12, 13, 12], hex: ['0c0d0c'], token: '--admin-surface-raised', name: 'fond de marque' },
  { rgb: [16, 17, 17], hex: ['101111'], token: '--admin-surface', name: 'surface de contenu' },
  { rgb: [9, 9, 9], hex: ['090909'], token: '--admin-surface-sunken', name: 'noir de marque' },
  {
    rgb: [244, 67, 54],
    hex: ['f44336', 'ef5350', 'ef4444', 'e05c5c', 'ff6b6b', 'ff8a80'],
    token: '--admin-danger',
    name: 'rouge d\'erreur',
  },
  {
    rgb: [215, 170, 37],
    hex: ['d7aa25', 'ffca28', 'ff9800', 'f5a623'],
    token: '--admin-warning',
    name: 'ambre d\'attente',
  },
];

/**
 * Exceptions declarees. Chacune doit dire pourquoi : une exception sans motif
 * est une derive qui a trouve le moyen de passer.
 */
const ALLOWED = [
  {
    files: [
      `${ADMIN}/pages/analytics/components/devices-chart.component.ts`,
      `${ADMIN}/pages/analytics/components/traffic-sources-chart.component.ts`,
      `${ADMIN}/pages/analytics/components/visitors-chart.component.ts`,
    ],
    why: 'Chart.js dessine sur canvas et n\'interprete pas var(). Palette categorielle : '
      + 'son objectif est de discriminer des series, pas de suivre le chrome.',
  },
  {
    files: [`${ADMIN}/pages/config/config-page.component.scss`],
    why: 'Previsualisation d\'un embed Discord : ce sont les couleurs de Discord. '
      + 'Les aligner sur les tokens DVG rendrait l\'apercu faux.',
  },
];

const RGB = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g;
const HEX = /#([0-9a-fA-F]{3,8})\b/g;

/** `#32D299` et `#32d299` sont la meme couleur : normaliser avant de comparer. */
function expandHex(h) {
  const v = h.toLowerCase();
  if (v.length === 3) return v[0] + v[0] + v[1] + v[1] + v[2] + v[2];
  if (v.length === 8) return v.slice(0, 6); // forme a huit chiffres produite par le minifieur
  return v.slice(0, 6);
}

const files = globSync(`${ADMIN}/**/*.{scss,ts}`, { cwd: ROOT })
  .filter((f) => !f.endsWith('.spec.ts'))
  .filter((f) => !ALLOWED.some((a) => a.files.includes(f)));

const findings = [];

for (const file of files) {
  const lines = readFileSync(new URL(file, `file://${ROOT}`), 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const rule of FORBIDDEN) {
      for (const m of line.matchAll(HEX)) {
        if (rule.hex.includes(expandHex(m[1]))) {
          findings.push({ file, line: i + 1, found: m[0], rule });
        }
      }
      for (const m of line.matchAll(RGB)) {
        const [r, g, b] = [+m[1], +m[2], +m[3]];
        if (rule.rgb[0] === r && rule.rgb[1] === g && rule.rgb[2] === b) {
          findings.push({ file, line: i + 1, found: m[0] + ')', rule });
        }
      }
    }
  });
}

if (findings.length === 0) {
  console.log(`check-admin-colors : ${files.length} fichiers, aucune couleur de marque en dur.`);
  process.exit(0);
}

console.error(`\ncheck-admin-colors : ${findings.length} couleur(s) de marque codee(s) en dur.\n`);
for (const f of findings) {
  console.error(`  ${relative('.', f.file)}:${f.line}`);
  console.error(`    ${f.found} — ${f.rule.name}, utiliser var(${f.rule.token})`);
}
console.error(
  '\nLa reference est ADMIN_DESIGN_SYSTEM.md. Si la valeur est legitime — palette de'
  + '\ngraphique, couleur d\'une marque tierce reproduite — declarez-la dans ALLOWED'
  + '\nen disant pourquoi.\n'
);
process.exit(1);
