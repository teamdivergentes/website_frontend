import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { OrderDialogComponent } from './order-dialog.component';
import { OrdersService } from '../../../shared/services/orders.service';
import { AuthService } from '../../../../shared/services/api/auth.service';
import { Order } from '../../../shared/models/order.model';

const PAID_ORDER = {
  id: 1,
  reference: 'DVG-2026-0042',
  items: [
    {
      id: 1,
      productId: 1,
      productName: 'Maillot 2026 — DVG × Joker',
      size: 'M',
      flockingText: 'Snake',
      quantity: 1,
      unitPriceCents: 4990,
      flockingFeeCents: 500,
      lineTotalCents: 5490,
    },
  ],
  subtotalCents: 5490,
  shippingCents: 590,
  totalCents: 6080,
  currency: 'eur',
  shippingMethod: 'STANDARD',
  customerEmail: 'jean@example.com',
  customerName: 'Jean Dupont',
  customerFirstName: 'Jean',
  customerLastName: 'Dupont',
  shippingAddress: { address: { line1: '1 rue du Test', postal_code: '75000', city: 'Paris' } },
  status: 'PAID',
  sentToMerchantAt: null,
  merchantBatchId: null,
  trackingNumber: null,
  adminNote: null,
  createdAt: '2026-07-20T10:00:00Z',
  updatedAt: '2026-07-20T10:00:00Z',
} as unknown as Order;

describe('OrderDialogComponent', () => {
  let fixture: ComponentFixture<OrderDialogComponent>;
  let component: OrderDialogComponent;
  let ordersService: jasmine.SpyObj<OrdersService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<OrderDialogComponent>>;
  let hasPermission: jasmine.Spy;

  const build = (order: Order = PAID_ORDER, permission = true) => {
    TestBed.resetTestingModule();
    ordersService = jasmine.createSpyObj('OrdersService', ['updateOrder', 'refundOrder']);
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    hasPermission = jasmine.createSpy('hasPermission').and.returnValue(permission);

    TestBed.configureTestingModule({
      imports: [OrderDialogComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: OrdersService, useValue: ordersService },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { order } },
        { provide: AuthService, useValue: { hasPermission } },
      ],
    });

    fixture = TestBed.createComponent(OrderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => build());

  /**
   * La ligne n'existe que pour signaler un ecart avant de transmettre le lot au
   * fabricant : l'afficher quand tout concorde noierait le signal.
   */
  describe('identite declaree', () => {
    it('se tait quand le prenom et le nom concordent avec le nom de livraison', () => {
      expect(component.declaredIdentity()).toBeNull();
    });

    it('ignore la casse et les espaces surnumeraires', () => {
      build({ ...PAID_ORDER, customerName: '  jean   DUPONT ' } as Order);

      expect(component.declaredIdentity()).toBeNull();
    });

    it('affiche l’identite declaree quand elle s’ecarte du nom de livraison', () => {
      build({ ...PAID_ORDER, customerName: 'ZeratoR' } as Order);

      expect(component.declaredIdentity()).toBe('Jean Dupont');
    });

    it('se tait sur une commande anterieure aux champs separes', () => {
      build({ ...PAID_ORDER, customerFirstName: '', customerLastName: '' } as Order);

      expect(component.declaredIdentity()).toBeNull();
    });
  });

  describe('permission', () => {
    it('masque le remboursement sans la permission commandes:write', () => {
      build(PAID_ORDER, false);
      expect(component.canRefund()).toBeFalse();
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.refund'),
      ).toBeNull();
    });

    it('affiche le remboursement avec la permission', () => {
      expect(component.canRefund()).toBeTrue();
      expect(
        (fixture.nativeElement as HTMLElement).querySelector('.refund'),
      ).not.toBeNull();
    });
  });

  describe('remboursabilité', () => {
    it('est remboursable sur une commande payée', () => {
      expect(component.isRefundable()).toBeTrue();
    });

    it("n'est pas remboursable sur une commande jamais payée", () => {
      build({ ...PAID_ORDER, status: 'PENDING' });
      expect(component.isRefundable()).toBeFalse();
    });

    it('n’est pas remboursable sur une commande déjà remboursée', () => {
      build({ ...PAID_ORDER, status: 'REFUNDED' });
      expect(component.isRefundable()).toBeFalse();
    });

    it('n’est pas remboursable sur une commande annulée', () => {
      build({ ...PAID_ORDER, status: 'CANCELLED' });
      expect(component.isRefundable()).toBeFalse();
    });
  });

  describe('remboursement', () => {
    it('exige une confirmation explicite avant l’appel', () => {
      expect(component.confirmingRefund()).toBeFalse();

      component.confirmingRefund.set(true);
      fixture.detectChanges();

      expect(ordersService.refundOrder).not.toHaveBeenCalled();
      // Le séparateur décimal suit la locale du navigateur de test, qui n'est
      // pas celle de l'application : on vérifie le montant, pas sa ponctuation.
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toMatch(/60[.,]80/);
    });

    it('appelle le service et reflète le nouveau statut en succès', () => {
      const refunded = {
        ...PAID_ORDER,
        status: 'REFUNDED' as const,
        stripeRefundId: 're_123',
        refundedAt: '2026-08-11T10:00:00Z',
      };
      ordersService.refundOrder.and.returnValue(of(refunded));
      component.confirmingRefund.set(true);

      component.refund();

      expect(ordersService.refundOrder).toHaveBeenCalledWith(1);
      expect(component.order()).toEqual(refunded);
      expect(component.confirmingRefund()).toBeFalse();
      expect(component.refunding()).toBeFalse();
    });

    it('affiche le message du serveur en erreur', () => {
      ordersService.refundOrder.and.returnValue(
        throwError(() => ({ error: { message: 'Commande déjà remboursée' } })),
      );
      component.confirmingRefund.set(true);

      component.refund();

      expect(component.refundError()).toBe('Commande déjà remboursée');
      expect(component.refunding()).toBeFalse();
      // Le dialogue reste sur la commande d'origine : rien n'a changé côté serveur.
      expect(component.order().status).toBe('PAID');
    });

    it('ne rembourse pas une commande non remboursable même en forçant l’appel', () => {
      build({ ...PAID_ORDER, status: 'REFUNDED' });

      component.refund();

      expect(ordersService.refundOrder).not.toHaveBeenCalled();
    });
  });
});
