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
