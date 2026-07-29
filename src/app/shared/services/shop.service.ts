import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateCheckoutPayload, ShopProduct } from '../models/shop-product.model';

@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/shop`;

  private readonly productsSignal = signal<ShopProduct[]>([]);
  readonly products = this.productsSignal.asReadonly();

  loadProducts(): Observable<ShopProduct[]> {
    return this.http
      .get<ShopProduct[]>(`${this.baseUrl}/products`)
      .pipe(tap((products) => this.productsSignal.set(products)));
  }

  /**
   * Cree une session de paiement. Le prix n'est volontairement pas transmis :
   * le serveur le recalcule depuis son propre catalogue.
   */
  createCheckout(payload: CreateCheckoutPayload): Observable<{ url: string }> {
    return this.http.post<{ url: string }>(`${this.baseUrl}/checkout`, payload);
  }
}
