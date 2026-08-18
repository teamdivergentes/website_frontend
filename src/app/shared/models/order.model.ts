export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'SENT_TO_MERCHANT'
  | 'IN_PRODUCTION'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Paiement non finalisé',
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

/**
 * Ligne de commande. Tous les libelles et montants sont des instantanes figes
 * a l'achat : le catalogue etant editable a chaud, une commande de mars doit
 * rester lisible avec le prix de mars.
 */
export interface OrderItem {
  id: number;
  productId: number | null;
  productName: string;
  size: string;
  flockingText: string | null;
  quantity: number;
  unitPriceCents: number;
  flockingFeeCents: number;
  lineTotalCents: number;
}

/** Marge d'une commande, calculee cote serveur a partir des couts figes a l'achat. */
export interface OrderMargin {
  revenueCents: number;
  itemsCostCents: number;
  shippingCostCents: number;
  totalCostCents: number;
  marginCents: number;
  /** Marge rapportee au chiffre d'affaires, en %. `null` si le total est nul. */
  marginRate: number | null;
  /** Frais de traitement du fournisseur, comptes une fois pour la commande. */
  orderFeeCents: number;
  /** Commission Stripe reellement prelevee. 0 si elle n'a pas pu etre lue. */
  stripeFeeCents: number;
  /** Vrai quand le colis a coute plus cher qu'il n'a ete facture. */
  shippingSoldAtLoss: boolean;
}

/**
 * Mode d'acheminement d'une commande.
 *
 * `EXPRESS` n'est plus proposable : l'option rapide a ete retiree de la
 * boutique, faute d'un tarif fournisseur garantissant le delai annonce. Le type
 * la conserve parce que des commandes deja passees la portent.
 */
export type ShippingMethod = 'STANDARD' | 'EXPRESS';

export interface Order {
  id: number;
  reference: string;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  items: OrderItem[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  currency: string;
  shippingMethod: ShippingMethod;
  /**
   * Absente sur les commandes anterieures au suivi des couts : leur marge n'a
   * jamais ete calculable, et l'inventer serait pire que de ne rien afficher.
   */
  margin?: OrderMargin;
  customerEmail: string;
  customerName: string;
  /**
   * Prenom et nom saisis separement sur la page de paiement. Chaines vides sur
   * toute commande anterieure a ces champs : l'affichage doit alors se
   * contenter de `customerName`, qui reste le nom de l'etiquette d'expedition.
   */
  customerFirstName: string;
  customerLastName: string;
  shippingAddress: ShippingAddress;
  status: OrderStatus;
  sentToMerchantAt: string | null;
  merchantBatchId: string | null;
  trackingNumber: string | null;
  adminNote: string | null;
  /**
   * Posés par `POST /admin/orders/:id/refund`, absents tant qu'aucun
   * remboursement n'a eu lieu. Une commande antérieure à cette fonctionnalité
   * n'a jamais ces champs, d'où l'optionnalité plutôt qu'un `null` par défaut.
   */
  stripeRefundId?: string;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PendingBatch {
  count: number;
  orders: Order[];
  recapText: string;
  csv: string;
}

/**
 * Compteurs de commandes affiches sur le dashboard et la page Statistiques.
 *
 * Les commandes `PENDING` sont exclues des deux chiffres cote serveur : ce sont
 * des sessions de paiement abandonnees. `windowDays` vient de l'API plutot que
 * d'etre ecrit en dur ici — le libelle a l'ecran doit suivre la fenetre reelle
 * si elle change.
 */
export interface OrderCounters {
  total: number;
  lastThirtyDays: number;
  windowDays: number;
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  trackingNumber?: string;
  adminNote?: string;
}
