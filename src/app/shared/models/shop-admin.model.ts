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
  shippingFeeCents: number;
  currency: string;
  ordersNotifyEmail: string | null;
  shopEnabled: boolean;
}

export interface UpdateShopSettingsDto {
  shippingFeeCents?: number;
  ordersNotifyEmail?: string;
  shopEnabled?: boolean;
}
