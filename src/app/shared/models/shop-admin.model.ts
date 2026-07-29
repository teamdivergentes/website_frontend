export interface ShopProductSize {
  id: number;
  label: string;
  position: number;
}

/** Vue admin d'un produit : inclut les champs d'administration. */
export interface AdminShopProduct {
  id: number;
  slug: string;
  name: string;
  shortDescription: string | null;
  description: string | null;
  priceCents: number;
  imageFront: string | null;
  imageBack: string | null;
  imageCard: string | null;
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
  imageFront?: string;
  imageBack?: string;
  imageCard?: string;
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
  shippingExpressCents: number;
  freeShippingThresholdCents: number;

  /** Ce que ca coute a la structure. Jamais expose au public. */
  costProductionCents: number;
  costPartnerCents: number;
  costPartnerEnabled: boolean;
  costEcommerceCents: number;
  costFlockingCents: number;
  costShippingStandardCents: number;
  costShippingExpressCents: number;
}

export interface UpdateShopSettingsDto {
  ordersNotifyEmail?: string;
  shopEnabled?: boolean;
  shippingStandardCents?: number;
  shippingExpressCents?: number;
  freeShippingThresholdCents?: number;
  costProductionCents?: number;
  costPartnerCents?: number;
  costPartnerEnabled?: boolean;
  costEcommerceCents?: number;
  costFlockingCents?: number;
  costShippingStandardCents?: number;
  costShippingExpressCents?: number;
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
