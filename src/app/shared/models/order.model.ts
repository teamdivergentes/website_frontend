export type OrderStatus =
  | 'PAID'
  | 'SENT_TO_MERCHANT'
  | 'IN_PRODUCTION'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PAID: 'Payée',
  SENT_TO_MERCHANT: 'Transmise au marchand',
  IN_PRODUCTION: 'En production',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

export interface ShippingAddress {
  name?: string;
  address?: {
    line1?: string;
    line2?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  };
}

export interface Order {
  id: number;
  reference: string;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  productId: string;
  productName: string;
  size: string | null;
  quantity: number;
  unitPriceCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  sentToMerchantAt: string | null;
  merchantBatchId: string | null;
  trackingNumber: string | null;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PendingBatch {
  count: number;
  orders: Order[];
  recapText: string;
  csv: string;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  trackingNumber?: string;
  adminNote?: string;
}
