export interface ShopProductSize {
  id: number;
  label: string;
  position: number;
}

/** Un visuel de la galerie, tel que l'admin l'édite. */
export interface AdminShopProductImage {
  id: number;
  url: string;
  label: string;
  position: number;
  /** Vue de dos : celle sur laquelle se pose l'aperçu du flocage. */
  isBack: boolean;
  /** Vignette de la liste boutique. Une seule par produit. */
  isCard: boolean;
}

/** Un visuel envoyé au serveur. L'ordre du tableau fait l'ordre d'affichage. */
export interface UpsertShopProductImage {
  url: string;
  label: string;
  isBack?: boolean;
  isCard?: boolean;
}

/** Vue admin d'un produit : inclut les champs d'administration. */
export interface AdminShopProduct {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  priceCents: number;
  /** Prix promotionnel, `null` quand aucune promotion n'est posée. */
  promoPriceCents: number | null;
  /** Fenêtre de la promotion, en ISO. Une borne nulle est ouverte. */
  promoStartsAt: string | null;
  promoEndsAt: string | null;
  images: AdminShopProductImage[];
  allowFlocking: boolean;
  flockingFeeCents: number;
  flockingTopPct: number;
  flockingLeftPct: number;
  teamId: number | null;
  active: boolean;
  position: number;
  sizes: ShopProductSize[];
}

export interface UpsertShopProductDto {
  slug?: string;
  name?: string;
  shortDescription?: string;
  description?: string;
  priceCents?: number;
  /** `null` met fin à la promotion en cours ; le serveur l'accepte pour cela. */
  promoPriceCents?: number | null;
  promoStartsAt?: string | null;
  promoEndsAt?: string | null;
  images?: UpsertShopProductImage[];
  allowFlocking?: boolean;
  flockingFeeCents?: number;
  flockingTopPct?: number;
  flockingLeftPct?: number;
  teamId?: number | null;
  active?: boolean;
  position?: number;
  sizes?: string[];
}

export interface ShopSettings {
  id: number;
  currency: string;
  ordersNotifyEmail: string | null;
  shopEnabled: boolean;

  /** Ce que paie le client. */
  shippingStandardCents: number;
  freeShippingThresholdCents: number;

  /** Ce que ca coute a la structure. Jamais expose au public. */
  costProductionCents: number;
  costPartnerCents: number;
  costPartnerEnabled: boolean;
  costEcommerceCents: number;
  costFlockingCents: number;
  costShippingStandardCents: number;
}

export interface UpdateShopSettingsDto {
  ordersNotifyEmail?: string;
  shopEnabled?: boolean;
  shippingStandardCents?: number;
  freeShippingThresholdCents?: number;
  costProductionCents?: number;
  costPartnerCents?: number;
  costPartnerEnabled?: boolean;
  costEcommerceCents?: number;
  costFlockingCents?: number;
  costShippingStandardCents?: number;
}

/** Nature d'un bon de réduction. */
export type DiscountType = 'FIXED' | 'PERCENTAGE';

/**
 * Un bon de réduction, tel que l'administration le lit.
 *
 * Les quatre bornes optionnelles suivent une convention constante : `null` vaut
 * « pas de limite », jamais « limite à zéro ».
 */
export interface AdminDiscountCode {
  id: number;
  code: string;
  type: DiscountType;
  /** Centimes pour `FIXED`, points de pourcentage pour `PERCENTAGE`. */
  value: number;
  minSubtotalCents: number | null;
  startsAt: string | null;
  endsAt: string | null;
  /** `1` fait un code à usage unique. `null` = illimité. */
  maxUses: number | null;
  /** Utilisations comptées au paiement. */
  usedCount: number;
  /**
   * Sessions de paiement encore ouvertes sur ce code. Ce ne sont pas des
   * ventes : une réservation peut expirer sans rien consommer.
   */
  reservedCount: number;
  active: boolean;
  createdAt: string;
}

export interface UpsertDiscountCodeDto {
  code?: string;
  type?: DiscountType;
  value?: number;
  minSubtotalCents?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  maxUses?: number | null;
  active?: boolean;
}

/** Marge d'une commande, calculee a partir des couts figes a l'achat. */
export interface OrderMargin {
  revenueCents: number;
  itemsCostCents: number;
  shippingCostCents: number;
  totalCostCents: number;
  marginCents: number;
  marginRate: number | null;
  shippingSoldAtLoss: boolean;
}
