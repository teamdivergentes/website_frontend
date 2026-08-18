import { ShopProduct } from '../../shared/models/shop-product.model';
import { SHOP_LEGAL, orMissing } from '../legal/legal-info';

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
 * La même information, en phrase autonome. Elle vit dans la composition et non
 * dans les informations de livraison : d'où viennent la matière et l'atelier
 * ne dit rien du délai ni du transport, et le client qui déplie « Livraison »
 * cherche une date, pas une provenance.
 */
export const ORIGIN_SENTENCE = `${ORIGIN[0].toUpperCase()}${ORIGIN.slice(1)}, à l'unité, après commande.`;

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
 * sont lues dans `SHOP_LEGAL` ; tant qu'elles ne sont pas fixées, `orMissing`
 * affiche un marqueur visible plutôt qu'un chiffre inventé : un engagement
 * contractuel ne se devine pas.
 */
/**
 * Zone de livraison énumérée, à porter sur la fiche produit. Le pays de
 * destination conditionne la possibilité même d'acheter : l'information est
 * due avant que le client n'ajoute au panier, pas seulement dans les CGV.
 * Source unique dans `SHOP_LEGAL`, bornée côté backend par la liste passée
 * à Stripe.
 */
export const SHIPPING_ZONE = SHOP_LEGAL.shippingZoneLabel;

export function shippingDelayNotice(): string {
  const shipping = orMissing(
    SHOP_LEGAL.shippingDelayBusinessDays === null
      ? null
      : `${SHOP_LEGAL.shippingDelayBusinessDays} jours ouvrés`,
    "délai d'expédition en jours ouvrés",
  );
  const carrier = orMissing(
    SHOP_LEGAL.carrierDelayBusinessDays === null
      ? null
      : `${SHOP_LEGAL.carrierDelayBusinessDays} jours ouvrés`,
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
 * filtré sur les tailles réellement proposées par le produit, et doit donc
 * couvrir TOUTE l'amplitude vendue : une taille présente au sélecteur mais
 * absente d'ici disparaît silencieusement du guide, et le client choisit à
 * l'aveugle.
 *
 * PROVISOIRE : ces valeurs viennent de la maquette et ne sont pas confirmées
 * par le fabricant (cf. EPIC-40). XXS, 3XL et 4XL prolongent la progression
 * des tailles déjà listées — 3 cm de poitrine par palier, 2 cm de longueur —
 * ils sont donc à confirmer au même titre, et même en priorité : ce sont des
 * extrémités de gamme, là où une coupe s'écarte le plus d'une règle de trois.
 */
export const SIZE_GUIDE: readonly { size: string; chest: string; length: string }[] = [
  { size: 'XXS', chest: '43', length: '64' },
  { size: 'XS', chest: '46', length: '66' },
  { size: 'S', chest: '49', length: '69' },
  { size: 'M', chest: '52', length: '72' },
  { size: 'L', chest: '55', length: '74' },
  { size: 'XL', chest: '58', length: '76' },
  { size: 'XXL', chest: '61', length: '78' },
  { size: '3XL', chest: '64', length: '80' },
  { size: '4XL', chest: '67', length: '82' },
];

export interface SpecRow {
  term: string;
  value: string;
}

/**
 * Consignes d'entretien. Ce sont celles d'usage pour une maille polyester
 * sublimee, volontairement conservatrices : elles protegent le flocage, qui
 * est ce qui part en premier. Elles n'ont PAS encore ete confirmees par le
 * fabricant et sont a valider avant l'ouverture au public — une consigne
 * d'entretien erronee se retourne contre le vendeur en cas de litige.
 */
export const CARE_INSTRUCTIONS: readonly string[] = [
  'Lavage en machine à 30 °C, sur l\'envers.',
  'Pas d\'adoucissant : il encrasse la maille et ternit les couleurs.',
  'Pas de sèche-linge, séchage à l\'air libre.',
  'Le produit ne se repasse pas.',
  'Pas de nettoyage à sec ni de javel.',
];

/**
 * Composition, telle qu'elle doit etre portee a la connaissance de l'acheteur.
 * L'etiquetage de composition est obligatoire (reglement UE n° 1007/2011), et
 * les deux mentions environnementales qui suivent le sont au titre du code de
 * l'environnement des lors que le textile est majoritairement synthetique.
 */
export const COMPOSITION_NOTES: readonly string[] = [
  `${MATERIAL[0].toUpperCase()}${MATERIAL.slice(1)}, ${WEIGHT}.`,
  'Le motif est sublimé dans la fibre et non imprimé dessus : il ne craquèle pas et ne part pas au lavage.',
  ORIGIN_SENTENCE,
  MICROFIBRE_NOTICE,
  SORTING_NOTICE,
];

/**
 * Code de coloris déduit du slug : `maillot-2026-joker` → `JOK`. Les segments
 * purement numériques sont ignorés pour ne pas retenir l'année. Le maillot de
 * la structure donnerait `DVG`, ce qui ne distinguerait rien dans une référence
 * déjà préfixée `DVG` : il porte le code du modèle standard.
 */
export function colourCode(product: ShopProduct): string {
  const segments = product.slug.split('-').filter((part) => part.length > 0 && !/^\d+$/.test(part));
  const segment = segments.at(-1) ?? product.slug;
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

/**
 * Montant du surcoût de flocage, tel qu'affiché à côté de son option d'achat
 * sur la fiche produit et au panier. Un montant rond s'écrit sans décimales
 * — « 5 € » — la virgule ne portant alors aucune information ; les décimales
 * ne reviennent que si le montant en a réellement (ex. « 4,50 € »).
 */
export function flockingFeeAmount(cents: number): string {
  const value = cents / 100;
  const isRound = Number.isInteger(value);
  return `${value.toLocaleString('fr-FR', {
    minimumFractionDigits: isRound ? 0 : 2,
    maximumFractionDigits: 2,
  })} €`;
}

/** Amplitude de tailles, ex. « XS à XXL ». Null si le produit n'en propose pas. */
export function sizeRange(sizes: readonly string[]): string | null {
  if (sizes.length === 0) {
    return null;
  }
  const last = sizes.at(-1);
  return sizes.length > 1 && last ? `${sizes[0]} à ${last}` : sizes[0];
}

/**
 * Ligne de méta affichée sous le laïus d'un maillot, en une seule ligne.
 * Volontairement limitée à ce qui distingue une déclinaison d'une autre : la
 * matière et le grammage sont communs aux trois et vivent en bas de page, les
 * répéter à chaque section n'apprendrait rien.
 */
export function metaFor(product: ShopProduct): string[] {
  const meta: string[] = [];

  const range = sizeRange(product.sizes.map((size) => size.label));
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
