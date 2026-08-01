/** Un visuel de la galerie, tel que le rail de la fiche produit l'affiche. */
export interface ShopProductImage {
  url: string;
  /** Ce qui est écrit sous la vignette : « face », « dos », « porté ». */
  label: string;
  /** Vue de dos : celle sur laquelle se pose l'aperçu du flocage. */
  isBack: boolean;
}

export interface ShopProduct {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  /** Texte brut : rendu par interpolation, jamais en innerHTML. */
  description: string | null;
  priceCents: number;
  /** Galerie ordonnée. La première entrée ouvre la fiche. */
  images: ShopProductImage[];
  /** Vignette de la liste boutique, à défaut la première image. */
  cardImage: string | null;
  allowFlocking: boolean;
  flockingFeeCents: number;
  /** Position de l'aperçu du flocage sur l'image de dos, en % de l'image. */
  flockingTopPct: number;
  flockingLeftPct: number;
  sizes: string[];
}

/**
 * Les frais de port voyagent avec le catalogue : le panier doit afficher le
 * total sans second aller-retour, et surtout afficher le même montant que
 * celui qui sera facturé.
 */
export interface ShopCatalog {
  products: ShopProduct[];
  /** Tarifs de livraison factures au client, par mode. */
  shippingStandardCents: number;
  shippingExpressCents: number;
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

/** Modes de livraison proposes au client. */
export type ShippingMethod = 'STANDARD' | 'EXPRESS';

export interface CreateCheckoutPayload {
  shippingMethod: ShippingMethod;
  items: {
    productId: number;
    size: string;
    quantity: number;
    flockingText?: string;
  }[];
}
