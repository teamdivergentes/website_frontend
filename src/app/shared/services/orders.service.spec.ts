import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrdersService } from './orders.service';
import { Order } from '../models/order.model';
import { environment } from '../../../environments/environment';

describe('OrdersService', () => {
  let service: OrdersService;
  let httpMock: HttpTestingController;

  const order = { id: 1, reference: 'DVG-2026-0042', status: 'PAID' } as Order;
  const adminBase = `${environment.apiUrl}/api/admin/orders`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        OrdersService,
      ],
    });
    service = TestBed.inject(OrdersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('charge les commandes et alimente le signal', () => {
    service.loadOrders().subscribe();
    const req = httpMock.expectOne(adminBase);
    expect(req.request.method).toBe('GET');
    req.flush([order]);

    expect(service.orders()).toEqual([order]);
  });

  it('transmet le filtre de statut en paramètre de requête', () => {
    service.loadOrders('SHIPPED').subscribe();
    const req = httpMock.expectOne(`${adminBase}?status=SHIPPED`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('récupère le lot en attente', () => {
    service.loadPendingBatch().subscribe();
    const req = httpMock.expectOne(`${adminBase}/pending-batch`);
    expect(req.request.method).toBe('GET');
    req.flush({ count: 0, orders: [], recapText: '', csv: '' });
  });

  it('marque le lot comme transmis', () => {
    service.markSent().subscribe();
    const req = httpMock.expectOne(`${adminBase}/mark-sent`);
    expect(req.request.method).toBe('POST');
    req.flush({ count: 2, batchId: 'batch-1' });
  });

  it('met à jour une commande et remplace l’entrée dans le signal', () => {
    service.loadOrders().subscribe();
    httpMock.expectOne(adminBase).flush([order]);

    const updated = { ...order, status: 'SHIPPED' as const };
    service.updateOrder(1, { status: 'SHIPPED' }).subscribe();
    const req = httpMock.expectOne(`${adminBase}/1`);
    expect(req.request.method).toBe('PATCH');
    req.flush(updated);

    expect(service.orders()).toEqual([updated]);
  });

  it('rembourse une commande sans corps et remplace l’entrée dans le signal', () => {
    service.loadOrders().subscribe();
    httpMock.expectOne(adminBase).flush([order]);

    const refunded = {
      ...order,
      status: 'REFUNDED' as const,
      stripeRefundId: 're_123',
      refundedAt: '2026-08-11T10:00:00Z',
    };
    service.refundOrder(1).subscribe();
    const req = httpMock.expectOne(`${adminBase}/1/refund`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({});
    req.flush(refunded);

    expect(service.orders()).toEqual([refunded]);
  });
});
