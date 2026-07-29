/**
 * Source unique des informations légales de la structure.
 *
 * Les pages légales (mentions, CGV, rétractation, confidentialité) et la
 * boutique lisent toutes d'ici : une adresse ou un délai ne doit exister qu'à
 * un seul endroit, sinon deux pages finissent par dire deux choses
 * différentes — ce qui, sur du contractuel, se paie.
 *
 * Les valeurs encore inconnues valent `null`. Les pages qui les affichent
 * doivent rendre `TODO_MARKER` à la place, de sorte qu'un trou juridique soit
 * visible à l'écran et ne parte jamais en production en silence.
 */

/** Rendu à la place d'une valeur manquante. Volontairement impossible à rater. */
export const TODO_MARKER = '⚠ À COMPLÉTER';

/** Affiche la valeur, ou le marqueur si elle n'est pas encore connue. */
export function orTodo(value: string | null, hint: string): string {
  return value ?? `${TODO_MARKER} : ${hint}`;
}

// ---------------------------------------------------------------------------
// Éditeur / vendeur
// ---------------------------------------------------------------------------

export const LEGAL = {
  name: 'Team Divergentes',
  legalForm: 'Association de droit local (loi 1908, Alsace-Moselle)',
  siren: '992 737 676',
  address: '1 rue des Bateliers, 67550 Vendenheim',
  email: 'contact@teamdivergentes.fr',
  publicationDirector: 'Merlin Tuhdarian',
  publicationDirectorRole: 'Président',

  /**
   * Obligatoire pour un vendeur à distance : le consommateur doit pouvoir
   * joindre rapidement le professionnel (art. L221-5 C. conso).
   */
  phone: null as string | null,

  /**
   * Numéro de TVA intracommunautaire si l'association est assujettie.
   * Si elle relève de la franchise en base, laisser `null` et renseigner
   * `vatExemptionNotice` à la place.
   */
  vatNumber: null as string | null,

  /**
   * Mention à porter sur les prix et factures en cas de franchise en base.
   * Valeur type : « TVA non applicable, article 293 B du CGI ».
   */
  vatExemptionNotice: null as string | null,
} as const;

// ---------------------------------------------------------------------------
// Boutique — vente à distance
// ---------------------------------------------------------------------------

export const SHOP_LEGAL = {
  /**
   * Délai maximal d'expédition annoncé au client, en jours ouvrés.
   * Les maillots sont sublimés à la commande et regroupés par lots
   * hebdomadaires vers l'atelier : le délai couvre l'attente du lot, la
   * production et la remise au transporteur.
   *
   * À défaut d'indication, la loi impose 30 jours (art. L216-1 C. conso) et le
   * dépassement ouvre la résolution de la vente. Le chiffre annoncé engage.
   *
   * PROVISOIRE (2026-07-29), en attente de confirmation du fabricant. Repris de
   * ce que CustomKit annonce publiquement, « up to 25 working days of the order
   * placement ». Volontairement large : leurs conditions excluent toute
   * responsabilité en cas de retard, DVG porte donc seul le risque de ce qu'il
   * annonce. Trois points restent à trancher avec eux et peuvent faire bouger
   * ces valeurs : les 25 jours vont-ils jusqu'au client final ou jusqu'à DVG,
   * le flocage rallonge-t-il, et quelles sont leurs périodes de fermeture.
   */
  shippingDelayBusinessDays: 25 as number | null,

  /** Délai d'acheminement du transporteur, une fois le colis expédié. */
  carrierDelayBusinessDays: 5 as number | null,

  /**
   * Adresse de retour des produits rétractés. Peut différer du siège si les
   * retours partent chez le fabricant.
   */
  returnAddress: null as string | null,

  /**
   * Qui supporte les frais de retour en cas de rétractation. La loi les met à
   * la charge du consommateur, sauf si le vendeur accepte de les prendre.
   */
  returnCostsBorneByCustomer: true,

  /**
   * Médiateur de la consommation. L'adhésion est obligatoire pour tout
   * professionnel vendant à des consommateurs, et ses coordonnées doivent
   * figurer sur le site et dans les CGV (art. L612-1 et R616-1 C. conso).
   */
  mediator: {
    name: null as string | null,
    address: null as string | null,
    website: null as string | null,
  },

  /**
   * Identifiant unique ADEME délivré à l'adhésion à la filière REP
   * Textiles (Refashion). Obligatoire dès lors que la structure met des
   * vêtements sur le marché français sous sa propre marque.
   */
  ademeUniqueId: null as string | null,
} as const;

// ---------------------------------------------------------------------------
// Hébergeur
// ---------------------------------------------------------------------------

export const HOST = {
  name: 'Contabo GmbH',
  address: 'Aschauer Strasse 32a, 81549 Munich, Allemagne',
  phone: '+49 89 3564717 70',
  website: 'https://contabo.com',
} as const;
