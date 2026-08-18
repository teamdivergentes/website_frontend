#!/usr/bin/env node
/**
 * Genere le jeu complet de favicons a partir des SVG livres par le designer.
 *
 * Ces sources arrivent en dix fichiers : cinq tailles (16, 32, 48, 192, 512)
 * fois deux variantes (sombre, blanche). Les cinq tailles portent le MEME
 * dessin, seul le `viewBox` change — un SVG etant vectoriel, une seule suffit
 * pour le favicon vectoriel. Les tailles intermediaires ne servent qu'a
 * rasteriser chaque PNG au plus pres de sa dimension finale.
 *
 * Les variantes se distinguent par leur remplissage : la sombre n'a aucun
 * attribut `fill` et compte sur le noir par defaut du moteur de rendu, la
 * blanche declare `.cls-1 { fill: #fff }`. On force la couleur dans les deux
 * cas plutot que de dependre de ce defaut.
 *
 * Usage : node scripts/generer-favicons.mjs <dossier-des-svg-sources>
 */

import { Buffer } from 'node:buffer';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const SOURCES = process.argv[2];
const SORTIE = 'src/assets/logos';

const SOMBRE = '#0C0D0C'; // logo sombre, pour une barre d'onglets claire
const CLAIR = '#FFFFFF'; // logo clair, pour une barre d'onglets sombre

if (!SOURCES) {
  console.error('Usage : node scripts/generer-favicons.mjs <dossier-des-svg-sources>');
  process.exit(1);
}

function source(taille) {
  const chemin = join(SOURCES, `DVG_Favicons_${taille}x${taille}.svg`);
  if (!existsSync(chemin)) {
    console.error(`Source introuvable : ${chemin}`);
    process.exit(1);
  }
  return readFileSync(chemin, 'utf8');
}

function colorer(svg, fill) {
  return svg.replace(/<svg /, `<svg fill="${fill}" `).replace(/fill:\s*#fff;?/gi, `fill: ${fill};`);
}

async function png(tailleSource, taille, fill, nom, fond) {
  let pipeline = sharp(Buffer.from(colorer(source(tailleSource), fill)), { density: 384 }).resize(
    taille,
    taille,
  );
  if (fond) pipeline = pipeline.flatten({ background: fond });
  await pipeline.png({ compressionLevel: 9 }).toFile(join(SORTIE, nom));
  if (!nom.startsWith('.')) console.log(nom); // les tuiles de l'ICO sont temporaires
}

// Favicon vectoriel bi-theme : la media query est evaluee par le navigateur
// dans le document SVG lui-meme, ce qui evite un second fichier.
const svg = source(512)
  .replace('<svg id="Calque_1" data-name="Calque 1" ', '<svg ')
  .replace(
    'viewBox="0 0 512 512">\n',
    `viewBox="0 0 512 512">
  <style>
    path { fill: ${SOMBRE}; }
    @media (prefers-color-scheme: dark) { path { fill: ${CLAIR}; } }
  </style>\n`,
  );
writeFileSync(join(SORTIE, 'favicon.svg'), svg);
console.log('favicon.svg');

await png(16, 16, SOMBRE, 'favicon-16x16.png');
await png(32, 32, SOMBRE, 'favicon-32x32.png');
await png(16, 16, CLAIR, 'favicon-16x16-dark.png');
await png(32, 32, CLAIR, 'favicon-32x32-dark.png');

// iOS ignore la transparence et compose sur du noir : on aplatit explicitement
// sur le fond de la charte plutot que de lui laisser le choix.
await png(192, 180, CLAIR, 'apple-touch-icon.png', SOMBRE);

/**
 * Assemble un ICO a partir de PNG deja encodes.
 *
 * Le format autorise depuis Windows Vista des images PNG brutes en lieu et place
 * du BMP historique, et tous les navigateurs vises les lisent. On evite ainsi
 * une dependance supplementaire : l'entete tient en une trentaine d'octets par
 * image, le reste est une concatenation.
 */
function assemblerIco(images) {
  const ENTETE = 6;
  const ENTREE = 16;
  const repertoire = Buffer.alloc(ENTETE + ENTREE * images.length);
  repertoire.writeUInt16LE(0, 0); // reserve
  repertoire.writeUInt16LE(1, 2); // type : icone
  repertoire.writeUInt16LE(images.length, 4);

  let offset = repertoire.length;
  images.forEach(({ taille, donnees }, i) => {
    const p = ENTETE + ENTREE * i;
    repertoire.writeUInt8(taille >= 256 ? 0 : taille, p); // 0 signifie 256
    repertoire.writeUInt8(taille >= 256 ? 0 : taille, p + 1);
    repertoire.writeUInt8(0, p + 2); // palette : aucune
    repertoire.writeUInt8(0, p + 3); // reserve
    repertoire.writeUInt16LE(1, p + 4); // plans
    repertoire.writeUInt16LE(32, p + 6); // bits par pixel
    repertoire.writeUInt32LE(donnees.length, p + 8);
    repertoire.writeUInt32LE(offset, p + 12);
    offset += donnees.length;
  });

  return Buffer.concat([repertoire, ...images.map((image) => image.donnees)]);
}

// L'ICO reste le repli ultime, notamment pour les agregateurs qui vont chercher
// `/favicon.ico` sans lire le HTML.
const tuilesIco = [];
for (const taille of [16, 32, 48]) {
  const nom = `.ico-${taille}.png`;
  await png(taille, taille, SOMBRE, nom);
  const chemin = join(SORTIE, nom);
  tuilesIco.push({ taille, donnees: readFileSync(chemin) });
  unlinkSync(chemin);
}
writeFileSync(join(SORTIE, 'favicon.ico'), assemblerIco(tuilesIco));
console.log('favicon.ico');
