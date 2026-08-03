#!/usr/bin/env node
/**
 * Verrou sur le socle typographique du site public.
 *
 * L'EPIC-42 a montre que documenter une regle ne suffit pas : trois artefacts
 * partages existaient avant lui — `_text.scss`, `_containers.scss`,
 * `DESIGN_SYSTEM.md` — tous documentes, tous contournes, parce que rien
 * n'obligeait a s'en servir. Le resultat tenait en trois chiffres : quinze blocs
 * SCSS reimplementant le meme titre, sept polices dont quatre sans usage, et
 * sept largeurs de page.
 *
 * **Une regle tenue par la seule discipline n'est pas tenue.** Ce script la
 * rend non contournable : il echoue le build, il n'avertit pas.
 *
 * Pendant du `check-admin-colors.mjs` de l'EPIC-45, meme principe, autre
 * perimetre : ici `src/app/pages` et les composants partages du site public.
 *
 * **Ce verrou ne couvre QUE la typographie.** Les couleurs de marque codees en
 * dur dans le site public — 36 relevees au 2026-08-03, dont 17 dans les `fill`
 * SVG de la page 404 — relevent d'un chantier distinct, sur le modele de
 * l'EPIC-45 cote admin. Les inclure ici rendrait le verrou rouge des sa pose,
 * et un verrou rouge finit desactive.
 *
 * Lance par `npm run lint`, donc par la CI.
 */
import { readFileSync, globSync } from 'node:fs';
import { relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

/** Fichiers verifies : le site public et ses composants partages. */
const CIBLES = ['src/app/pages/**/*.{scss,ts,html}', 'src/app/shared/components/**/*.{scss,ts,html}'];

/**
 * Fichiers exemptes, avec la raison. Toute exemption doit etre justifiee ici :
 * une liste qui grossit sans motif est le premier signe que le verrou lache.
 */
const EXEMPTIONS = [
  // Le socle lui-meme declare les polices — c'est sa raison d'etre.
  'src/app/shared/components/layout/',
  // `image-upload` ne sert qu'au panel d'administration, malgre son
  // emplacement dans `shared/` : il releve de `_admin-tokens.scss`.
  'src/app/shared/components/image-upload/',
];

const REGLES = [
  {
    nom: 'police litterale',
    // Une declaration de police doit passer par un role. On ne matche donc que
    // les valeurs qui ne commencent PAS par `var(` et qui ne sont pas un simple
    // mot-cle CSS — `font-family: 'Bebas Neue'`, `font-family: Athiti`, etc.
    motif: /font-family\s*:\s*(?!var\(|inherit|initial|unset|revert)['"]?[A-Za-z]/g,
    // Le monospace est autorise : afficher du code dans un article n'est ni de
    // l'affichage ni du corps de texte, et aucun role ne le couvre.
    ignore: /monospace/,
    message: 'utilise var(--font-display) ou var(--font-body), jamais un nom de police',
  },
  // La redefinition d'une classe de titre est traitee a part (voir plus bas) :
  // elle demande de lire le BLOC, pas la ligne. Une page peut legitimement
  // ajuster l'espacement d'un titre dans son contexte ; ce qu'elle ne doit pas
  // faire, c'est redeclarer les proprietes du contrat.
  {
    nom: 'role de police inexistant',
    // Ces roles ont ete supprimes ou n'ont jamais existe : les referencer
    // produit une declaration invalide, ignoree en silence.
    motif: /var\(\s*--font-(decorative|Bebas-Neue|Athiti|Asar|Bellota|bellota|asar|athiti)\s*[,)]/g,
    message: 'role de police supprime — utiliser --font-display ou --font-body',
  },
];

/**
 * Les sept proprietes que porte `%heading`. Ce sont elles que chaque page
 * redeclarait avant l'EPIC-42 — quinze blocs SCSS pour le meme titre. Une page
 * reste libre de l'espacement (`margin`, `padding`) et de la mise en place
 * (`display`, `text-align`) : c'est le contexte, pas le contrat.
 */
const CONTRAT = [
  'font-family',
  'font-size',
  'font-weight',
  'letter-spacing',
  'line-height',
  'text-transform',
  'color',
];

const estExempte = (chemin) => EXEMPTIONS.some((e) => chemin.includes(e));

const infractions = [];

for (const motif of CIBLES) {
  for (const absolu of globSync(motif, { cwd: ROOT })) {
    const chemin = relative('', absolu);
    if (estExempte(chemin)) continue;

    const contenu = readFileSync(new URL(absolu, `file://${ROOT}`), 'utf8');
    const lignes = contenu.split('\n');

    lignes.forEach((ligne, i) => {
      // Les commentaires ne sont pas du code.
      const nue = ligne.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
      if (!nue.trim()) return;

      for (const regle of REGLES) {
        if (regle.ignore?.test(nue)) continue;
        regle.motif.lastIndex = 0;
        if (regle.motif.test(nue)) {
          infractions.push({ chemin, ligne: i + 1, regle: regle.nom, message: regle.message, extrait: nue.trim() });
        }
      }

      // Redefinition d'une classe de titre : on lit le bloc, pas la ligne.
      // La classe elle-meme, eventuellement suivie de modificateurs ou d'un
      // etat — pas ses descendants. `.heading-2 .since {` style un element
      // A L'INTERIEUR d'un titre : c'est legitime et hors contrat.
      const ouverture = nue.match(
        /^\s*\.(title|section-title|heading-(?:display|[1-5]|label))((\.|:)[a-zA-Z-]+)*\s*(,[^{]*)?\{/,
      );
      if (ouverture) {
        const bloc = [];
        for (let j = i + 1, prof = 1; j < lignes.length && prof > 0; j++) {
          prof += (lignes[j].match(/\{/g) || []).length - (lignes[j].match(/\}/g) || []).length;
          if (prof > 0) bloc.push(lignes[j]);
        }
        const redeclarees = CONTRAT.filter((p) =>
          bloc.some((l) => new RegExp(`^\\s*${p}\\s*:`).test(l.replace(/\/\/.*$/, ''))),
        );
        if (redeclarees.length > 0) {
          infractions.push({
            chemin,
            ligne: i + 1,
            regle: 'redefinition du contrat d’une classe de titre',
            message: `${redeclarees.join(', ')} appartient a _typography.scss — seuls l'espacement et la mise en place restent libres`,
            extrait: nue.trim(),
          });
        }
      }
    });
  }
}

const nbFichiers = CIBLES.flatMap((m) => globSync(m, { cwd: ROOT })).filter((f) => !estExempte(f)).length;

if (infractions.length === 0) {
  console.log(`check-public-typography : ${nbFichiers} fichiers, socle respecte.`);
  process.exit(0);
}

console.error(`\ncheck-public-typography : ${infractions.length} infraction(s) au socle du site public.\n`);
for (const i of infractions) {
  console.error(`  ${i.chemin}:${i.ligne}`);
  console.error(`    ${i.regle} — ${i.message}`);
  console.error(`    ${i.extrait.slice(0, 100)}\n`);
}
console.error('Voir CLAUDE.md, section « Formalismes du site public ».\n');
process.exit(1);
