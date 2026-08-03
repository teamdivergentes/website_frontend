import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateCheckoutPayload,
  ShopCatalog,
  ShopProduct,
} from '../models/shop-product.model';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/shop`;

  private readonly catalogSignal = signal<ShopCatalog | null>(null);
  readonly catalog = this.catalogSignal.asReadonly();

  readonly products = computed<ShopProduct[]>(() => this.catalogSignal()?.products ?? []);
  readonly shippingStandardCents = computed(
    () => this.catalogSignal()?.shippingStandardCents ?? 0,
  );
  readonly shippingExpressCents = computed(() => this.catalogSignal()?.shippingExpressCents ?? 0);
  readonly freeShippingThresholdCents = computed(
    () => this.catalogSignal()?.freeShippingThresholdCents ?? 0,
  );
  /** Vrai tant que le catalogue n'a pas répondu : évite un faux « boutique fermée ». */
  readonly shopEnabled = computed(() => this.catalogSignal()?.shopEnabled ?? true);

  loadCatalog(): Observable<ShopCatalog> {
    return this.http
      .get<ShopCatalog>(`${this.baseUrl}/products`)
      .pipe(tap((catalog) => this.catalogSignal.set(catalog)));
  }

  findBySlug(slug: string): Observable<ShopProduct> {
    return this.http.get<ShopProduct>(`${this.baseUrl}/products/${slug}`);
  }

  /**
   * Crée une session de paiement. Aucun montant n'est transmis : le serveur
   * recalcule prix, surcoût de flocage et frais de port depuis sa base.
   */
  createCheckout(payload: CreateCheckoutPayload): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.baseUrl}/checkout`, payload);
  }

  /**
   * Crée une session de paiement au tarif réservé.
   *
   * La charge utile est **exactement la même** que celle du tunnel public :
   * aucun montant, aucun indicateur de tarif. Le barème est déduit côté serveur
   * du jeton d'authentification, et cette route est refusée à qui ne porte pas
   * la permission. Rien ici ne peut l'influencer — ce bouton n'est qu'un
   * raccourci d'appel, pas une autorisation.
   */
  createRetailCheckout(payload: CreateCheckoutPayload): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.baseUrl}/checkout/retail`, payload);
  }
}
