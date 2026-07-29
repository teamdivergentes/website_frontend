import { ShopProduct } from '../../shared/models/shop-product.model';
import { SHOP_LEGAL, orTodo } from '../legal/legal-info';

/**
 * Ce que la boutique et la fiche produit doivent savoir présenter d'un maillot
 * et que l'API ne porte pas : code de coloris, découpe du titre, spécifications
 * de collection. Regroupé ici pour que les deux vues racontent exactement la
 * même chose.
 */

/**
 * Caractéristiques communes à toute la collection 2026, telles que les donne la
 * fiche technique du fabricant : composition 100 % polyester, 135 g/m².
 */
export const MATERIAL = 'maille sublimée 100 % polyester';
export const WEIGHT = '135 g/m²';

/**
 * Origine des maillots. Ne jamais écrire « en France » ici : le fabricant est
 * CustomKit (SIA SWL, Riga), qui sublime et floque en Lettonie à partir de
 * matières sourcées dans l'Union. Une allégation d'origine géographique
 * inexacte est une pratique commerciale trompeuse expressément visée par
 * l'article L121-4 du code de la consommation, et elle se voit depuis
 * l'extérieur. La formulation retenue reste vraie quel que soit l'atelier
 * européen retenu.
 */
export const ORIGIN = 'matières et fabrication européennes';

/**
 * Mention à porter à côté de tout prix affiché au consommateur : la loi
 * impose d'indiquer sans ambiguïté qu'il s'agit d'un prix toutes taxes
 * comprises (art. L112-1 C. conso). Le même libellé sert au prix unitaire de
 * la fiche produit, à son total et à la liste boutique : les trois
 * affichages doivent dire exactement la même chose.
 */
export const TAX_LABEL = 'TTC';

/**
 * Délai de livraison à annoncer avant l'achat. L'art. L216-1 C. conso
 * impose d'informer le consommateur du délai de livraison avant la
 * conclusion du contrat : aujourd'hui il n'apparaît qu'après le paiement, sur
 * la page de confirmation, ce qui est trop tard. Les deux composantes du
 * délai (expédition depuis l'atelier, puis acheminement du transporteur)
 * sont lues dans `SHOP_LEGAL` ; tant qu'elles ne sont pas fixées, `orTodo`
 * affiche un marqueur visible plutôt qu'un chiffre inventé : un engagement
 * contractuel ne se devine pas.
 */
export function shippingDelayNotice(): string {
  const shipping = orTodo(
    SHOP_LEGAL.shippingDelayBusinessDays !== null
      ? `${SHOP_LEGAL.shippingDelayBusinessDays} jours ouvrés`
      : null,
    "délai d'expédition en jours ouvrés",
  );
  const carrier = orTodo(
    SHOP_LEGAL.carrierDelayBusinessDays !== null
      ? `${SHOP_LEGAL.carrierDelayBusinessDays} jours ouvrés`
      : null,
    'délai transporteur en jours ouvrés',
  );
  return `Expédition sous ${shipping} après commande, puis ${carrier} d'acheminement.`;
}

/**
 * Rejet de microfibres plastiques au lavage : mention obligatoire pour tout
 * textile composé à plus de 50 % de fibres synthétiques (art. L541-9-1 C.
 * env., décret n° 2022-748 du 29 avril 2022). Les maillots sont en 100 %
 * polyester (cf. `MATERIAL`), donc systématiquement concernés.
 */
export const MICROFIBRE_NOTICE =
  "Ce produit rejette des microfibres plastiques dans l'environnement lors du lavage.";

/**
 * Consigne de tri au titre de la filière REP Textiles (Refashion). Pour la
 * vente à distance, cette information doit être fournie de façon
 * dématérialisée sur la fiche produit (art. R541-12-18 C. env.).
 *
 * Ce texte ne suffit pas à lui seul : la signalétique Triman est un
 * pictogramme dont la forme est fixée par arrêté, et il doit être apposé à
 * côté de cette phrase. Tant que l'adhésion à Refashion n'est pas faite,
 * l'image officielle n'est pas disponible et la fiche reste incomplète sur ce
 * point. Ne jamais la remplacer par le mot « Triman » écrit en toutes lettres.
 */
export const SORTING_NOTICE =
  'Ce produit se recycle, il ne se jette pas. À déposer en point de collecte textile.';

/**
 * Mesures du vêtement à plat, en centimètres. Elles ne sont pas en base : le
 * catalogue ne stocke que la liste des tailles disponibles. Le tableau est
 * filtré sur les tailles réellement proposées par le produit.
 */
export const SIZE_GUIDE: readonly { size: string; chest: string; length: string }[] = [
  { size: 'XS', chest: '46', length: '66' },
  { size: 'S', chest: '49', length: '69' },
  { size: 'M', chest: '52', length: '72' },
  { size: 'L', chest: '55', length: '74' },
  { size: 'XL', chest: '58', length: '76' },
  { size: 'XXL', chest: '61', length: '78' },
];

export interface SpecRow {
  term: string;
  value: string;
}

/**
 * Code de coloris déduit du slug : `maillot-2026-joker` → `JOK`. Les segments
 * purement numériques sont ignorés pour ne pas retenir l'année. Le maillot de
 * la structure donnerait `DVG`, ce qui ne distinguerait rien dans une référence
 * déjà préfixée `DVG` : il porte le code du modèle standard.
 */
export function colourCode(product: ShopProduct): string {
  const segment =
    product.slug
      .split('-')
      .filter((part) => part.length > 0 && !/^\d+$/.test(part))
      .at(-1) ?? product.slug;
  const code = segment.slice(0, 3).toUpperCase();
  return code === 'DVG' ? 'STD' : code;
}

/** Année de collection lue dans le slug : `maillot-2026-joker` → `26`. */
export function collectionYear(product: ShopProduct): string | null {
  const match = /(?:^|-)20(\d{2})(?:-|$)/.exec(product.slug);
  return match ? match[1] : null;
}

/** Référence d'atelier affichée sous le visuel, ex. « DVG26 / JOK ». */
export function reference(product: ShopProduct): string {
  const year = collectionYear(product);
  const code = colourCode(product);
  return year ? `DVG${year} / ${code}` : `DVG / ${code}`;
}

/** Tirets cadratins, croix de collaboration, barres : de la ponctuation de fiche produit. */
const SEPARATORS = /\s*[—–×|·]\s*/g;

/**
 * Les noms du catalogue sont construits « Maillot 2026 — DVG × Joker ». Le nom
 * d'équipe suit le dernier séparateur : c'est lui qui prend l'accent vert. Le
 * reste est nettoyé de sa ponctuation, qui n'apporte rien une fois le titre
 * composé en Bebas. Sans séparateur, on retombe sur le dernier mot.
 */
export function splitTitle(name: string): { lead: string; accent: string } {
  const trimmed = name.trim();

  let cut = -1;
  let cutEnd = -1;
  let match: RegExpExecArray | null;
  SEPARATORS.lastIndex = 0;
  while ((match = SEPARATORS.exec(trimmed)) !== null) {
    cut = match.index;
    cutEnd = match.index + match[0].length;
  }

  if (cut >= 0) {
    const accent = trimmed.slice(cutEnd).trim();
    if (accent.length > 0) {
      return { lead: cleanLead(trimmed.slice(0, cut)), accent };
    }
  }

  const words = trimmed.split(/\s+/);
  const accent = words.pop() ?? trimmed;
  return { lead: cleanLead(words.join(' ')), accent };
}

/**
 * Le lead perd sa ponctuation de séparation et la mention de la structure : sur
 * le site de DVG, « Maillot 2026 DVG Joker » se lit « Maillot 2026 Joker ».
 */
function cleanLead(lead: string): string {
  return lead
    .replace(SEPARATORS, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 0 && word.toUpperCase() !== 'DVG')
    .join(' ');
}

/**
 * Le nom tel qu'on l'écrit à l'écran : sans ponctuation de séparation ni
 * répétition de la structure. « Maillot 2026 — DVG × Joker » se lit
 * « Maillot 2026 Joker », du fil d'Ariane à l'onglet du navigateur.
 */
export function displayName(product: ShopProduct): string {
  const { lead, accent } = splitTitle(product.name);
  return lead ? `${lead} ${accent}` : accent;
}

/** Le point final d'une phrase de catalogue n'a pas sa place dans un label. */
export function asLabel(text: string): string {
  return text.trim().replace(/\.$/, '');
}

export function euros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

/** Amplitude de tailles, ex. « XS à XXL ». Null si le produit n'en propose pas. */
export function sizeRange(sizes: readonly string[]): string | null {
  if (sizes.length === 0) {
    return null;
  }
  return sizes.length > 1 ? `${sizes[0]} à ${sizes[sizes.length - 1]}` : sizes[0];
}

/**
 * Ligne de méta affichée sous le laïus d'un maillot, en une seule ligne.
 * Volontairement limitée à ce qui distingue une déclinaison d'une autre : la
 * matière et le grammage sont communs aux trois et vivent en bas de page, les
 * répéter à chaque section n'apprendrait rien.
 */
export function metaFor(product: ShopProduct): string[] {
  const meta: string[] = [];

  const range = sizeRange(product.sizes);
  if (range) {
    meta.push(range);
  }

  if (product.allowFlocking) {
    meta.push(
      product.flockingFeeCents > 0
        ? `flocage au pseudo, + ${euros(product.flockingFeeCents)}`
        : 'flocage au pseudo offert',
    );
  }

  return meta;
}
