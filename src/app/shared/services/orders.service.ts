import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, OrderCounters, OrderStatus, PendingBatch, UpdateOrderDto } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly adminBase = `${environment.apiUrl}/api/admin/orders`;

  private readonly ordersSignal = signal<Order[]>([]);
  readonly orders = this.ordersSignal.asReadonly();

  loadOrders(status?: OrderStatus): Observable<Order[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http
      .get<Order[]>(this.adminBase, { params })
      .pipe(tap((orders) => this.ordersSignal.set(orders)));
  }

  /**
   * Compteurs du dashboard et de la page Statistiques. Les deux ecrans tapent
   * le meme endpoint : deux calculs divergeraient au premier changement de
   * definition du perimetre.
   */
  loadCounters(): Observable<OrderCounters> {
    return this.http.get<OrderCounters>(`${this.adminBase}/stats`);
  }

  loadPendingBatch(): Observable<PendingBatch> {
    return this.http.get<PendingBatch>(`${this.adminBase}/pending-batch`);
  }

  markSent(): Observable<{ count: number; batchId: string }> {
    return this.http.post<{ count: number; batchId: string }>(`${this.adminBase}/mark-sent`, {});
  }

  updateOrder(id: number, dto: UpdateOrderDto): Observable<Order> {
    return this.http
      .patch<Order>(`${this.adminBase}/${id}`, dto)
      .pipe(
        tap((updated) =>
          this.ordersSignal.set(this.ordersSignal().map((o) => (o.id === id ? updated : o))),
        ),
      );
  }
}
