export interface ShopProduct {
  id: string;
  name: string;
  priceCents: number;
  sizes: string[];
  descKey: string;
  images: { front: string; back: string | null };
  active: boolean;
}

export interface CreateCheckoutPayload {
  productId: string;
  size?: string;
  quantity: number;
}
