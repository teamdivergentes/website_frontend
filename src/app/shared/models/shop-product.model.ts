export interface ShopProduct {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  /** Texte brut : rendu par interpolation, jamais en innerHTML. */
  description: string | null;
  priceCents: number;
  imageFront: string | null;
  imageBack: string | null;
  imageCard: string | null;
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
  shippingFeeCents: number;
  currency: string;
  shopEnabled: boolean;
}

/** Longueur maximale du flocage, alignée sur la validation serveur. */
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
}
