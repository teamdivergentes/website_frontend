/** Un visuel de la galerie, tel que le rail de la fiche produit l'affiche. */
export interface ShopProductImage {
  url: string;
  /** Ce qui est écrit sous la vignette : « face », « dos », « porté ». */
  label: string;
  /** Vue de dos : celle sur laquelle se pose l'aperçu du flocage. */
  isBack: boolean;
}

/**
 * Une taille telle que le catalogue public la présente : le libellé qui
 * s'affiche, et la disponibilité qui décide si le bouton se clique.
 *
 * Pas d'identifiant ici : le catalogue public ne connaît une taille que par
 * son libellé. Un refus de stock (`OutOfStockItem.size`) se recolle donc à
 * une ligne du panier — qui, elle, connaît son propre libellé — pas à ce
 * tableau.
 */
export interface ShopProductSizeAvailability {
  label: string;
  /** Faux : la taille reste visible, marquée « Épuisé », mais ne se sélectionne plus. */
  inStock: boolean;
}

export interface ShopProduct {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  /** Texte brut : rendu par interpolation, jamais en innerHTML. */
  description: string | null;
  /** Ce que le client paie : le prix promotionnel s'il y en a un, sinon le catalogue. */
  priceCents: number;
  /**
   * Prix catalogue à barrer, **uniquement** pendant une promotion active,
   * `null` le reste du temps.
   *
   * Sa seule présence dit qu'il y a une promotion : rien à comparer, et une
   * promotion échue disparaît de la vitrine sans que le front s'en occupe.
   */
  listPriceCents: number | null;
  /** Galerie ordonnée. La première entrée ouvre la fiche. */
  images: ShopProductImage[];
  /** Vignette de la liste boutique, à défaut la première image. */
  cardImage: string | null;
  allowFlocking: boolean;
  flockingFeeCents: number;
  /** Position de l'aperçu du flocage sur l'image de dos, en % de l'image. */
  flockingTopPct: number;
  flockingLeftPct: number;
  sizes: ShopProductSizeAvailability[];
  /**
   * Vrai quand plus aucune taille n'est disponible. Distinct d'une absence de
   * taille en stock déduite côté front : c'est le serveur qui tranche, et un
   * produit épuisé remplace tout le panneau d'achat par un état dédié.
   */
  soldOut: boolean;
}

/**
 * Les frais de port voyagent avec le catalogue : le panier doit afficher le
 * total sans second aller-retour, et surtout afficher le même montant que
 * celui qui sera facturé.
 */
export interface ShopCatalog {
  products: ShopProduct[];
  /** Tarif de livraison facture au client. Un seul mode d'expedition. */
  shippingStandardCents: number;
  /** Panier a partir duquel le port est offert. 0 = pas de franchise. */
  freeShippingThresholdCents: number;
  currency: string;
  shopEnabled: boolean;
}

/**
 * Longueur maximale du flocage, alignée sur la validation serveur.
 *
 * ⚠️ La même valeur est écrite à la main dans `backend/src/shop/shop-flocking.ts`,
 * d'où partent le validateur du DTO de commande et `assertFlockingAllowed`. Les
 * deux dépôts ne partagent rien, et l'ordre de déploiement dépend du sens :
 *
 * - **la monter** : le serveur d'abord. Un front plus permissif que l'API fait
 *   accepter à la saisie un pseudo refusé au paiement.
 * - **la baisser** : le front d'abord. C'est lui qui devient le plus strict, et
 *   une API restée permissive ne gêne personne.
 */
export const FLOCKING_MAX_LENGTH = 12;

/** Charset accepté, aligné sur `assertFlockingAllowed` côté serveur. */
export const FLOCKING_PATTERN = /^[A-Za-z0-9 .\-_]*$/;

/**
 * Ligne de panier. Ne porte volontairement **aucun montant** : les prix sont
 * recalculés depuis le catalogue à chaque affichage, pour qu'un panier laissé
 * ouvert une semaine ne facture pas un tarif périmé. Le serveur les recalcule
 * de son côté au checkout.
 */
export interface CartLine {
  productId: number;
  size: string;
  quantity: number;
  flockingText: string | null;
}

export interface CreateCheckoutPayload {
  items: {
    productId: number;
    size: string;
    quantity: number;
    flockingText?: string;
  }[];
  /**
   * Bon de réduction, facultatif. Le front transmet **la chaîne saisie** et
   * affiche la réponse : il n'évalue jamais la validité d'un code lui-même.
   * Toute règle recopiée ici serait une seconde source de vérité, et la seule
   * des deux que l'utilisateur peut modifier.
   */
  discountCode?: string;
}

/** Une ligne du refus, telle que le serveur la formule sur un 409 `OUT_OF_STOCK`. */
export interface OutOfStockItem {
  productId: number;
  sizeId: number;
  /** Libellé de la taille refusée, celui-là même que la ligne du panier a transmis. */
  size: string;
  requested: number;
  /** Ce qu'il reste réellement en stock, jamais une quantité négative. */
  available: number;
}

/** Corps d'un refus 409 du devis ou du checkout, quand une taille manque de stock. */
export interface OutOfStockError {
  code: 'OUT_OF_STOCK';
  items: OutOfStockItem[];
}

/**
 * Reconnaît un refus de stock dans l'objet d'erreur qu'Angular remonte depuis
 * `HttpClient`, sans présumer de sa forme : un refus réseau, un 500 générique
 * ou un 429 de throttle n'ont pas ce corps, et doivent rester traités par les
 * messages génériques existants.
 */
export function isOutOfStockError(error: unknown): error is { status: 409; error: OutOfStockError } {
  const response = error as { status?: number; error?: { code?: string; items?: unknown } };
  return (
    response?.status === 409 &&
    response?.error?.code === 'OUT_OF_STOCK' &&
    Array.isArray(response.error?.items)
  );
}

/**
 * Devis renvoyé par le serveur quand le panier porte un bon de réduction.
 *
 * Le panier reste maître de son affichage courant — il recalcule tout depuis le
 * catalogue — mais la remise, elle, ne se calcule que côté serveur.
 */
export interface CartQuote {
  lines: {
    productId: number;
    productName: string;
    size: string;
    flockingText: string | null;
    quantity: number;
    unitPriceCents: number;
    listUnitPriceCents: number;
    flockingFeeCents: number;
    lineTotalCents: number;
  }[];
  subtotalCents: number;
  discountCents: number;
  /** Le code retenu, absent quand le panier n'en porte pas. */
  discountCode?: string;
  shippingCents: number;
  shippingIsFree: boolean;
  totalCents: number;
  currency: string;
}

/** Une ligne du recapitulatif affiche apres paiement. */
export interface OrderConfirmationItem {
  productName: string;
  size: string;
  flockingText: string | null;
  quantity: number;
}

/**
 * Ce que le serveur consent a rendre a la page de remerciement, a partir du
 * seul identifiant de session Stripe rapporte par la redirection.
 *
 * Volontairement pauvre : cet identifiant voyage dans une URL, il ne peut pas
 * ouvrir un dossier client. Ni nom complet, ni adresse, ni e-mail en clair.
 */
export interface OrderConfirmation {
  reference: string;
  /** Prenom seul. `null` si Stripe ne l'a pas transmis. */
  firstName: string | null;
  /** Faux tant que le webhook Stripe n'a pas confirme le paiement. */
  paid: boolean;
  /** E-mail masque : assez pour reconnaitre sa boite, pas pour la lire. */
  maskedEmail: string | null;
  items: OrderConfirmationItem[];
  totalCents: number;
  currency: string;
}
