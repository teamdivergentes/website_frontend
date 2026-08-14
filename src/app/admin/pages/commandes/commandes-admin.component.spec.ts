import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NEVER, of, throwError } from 'rxjs';
import { CommandesAdminComponent } from './commandes-admin.component';
import { OrdersService } from '../../../shared/services/orders.service';
import { Order } from '../../../shared/models/order.model';

describe('CommandesAdminComponent', () => {
  let fixture: ComponentFixture<CommandesAdminComponent>;
  let component: CommandesAdminComponent;
  let ordersService: jasmine.SpyObj<OrdersService>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const paidOrder = {
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
    customerName: 'Jean Dupont',
    status: 'PAID',
    createdAt: '2026-07-20T10:00:00Z',
  } as unknown as Order;

  const shippedOrder = { ...paidOrder, id: 2, reference: 'DVG-2026-0043', status: 'SHIPPED' as const };

  beforeEach(async () => {
    const ordersSignal = signal<Order[]>([paidOrder, shippedOrder]);
    const serviceSpy = jasmine.createSpyObj(
      'OrdersService',
      ['loadOrders', 'loadPendingBatch', 'markSent', 'updateOrder'],
      { orders: ordersSignal.asReadonly() },
    );
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    const snackSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [CommandesAdminComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: OrdersService, useValue: serviceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: MatSnackBar, useValue: snackSpy },
      ],
    }).compileComponents();

    ordersService = TestBed.inject(OrdersService) as jasmine.SpyObj<OrdersService>;
    dialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    ordersService.loadOrders.and.returnValue(NEVER);
    fixture = TestBed.createComponent(CommandesAdminComponent);
    component = fixture.componentInstance;
  });

  it('devrait être créé', () => {
    expect(component).toBeTruthy();
  });

  it('compte les commandes en attente de transmission', () => {
    expect(component.pendingCount()).toBe(1);
  });

  it('filtre la liste par statut', () => {
    component.onStatusFilterChange('SHIPPED');
    expect(component.filteredOrders()).toEqual([shippedOrder]);
  });

  it('affiche toutes les commandes quand le filtre est vide', () => {
    component.onStatusFilterChange('');
    expect(component.filteredOrders().length).toBe(2);
  });

  it('ouvre la modale de récapitulatif avec le lot chargé', () => {
    const batch = { count: 1, orders: [paidOrder], recapText: 'DVG-2026-0042', csv: 'reference' };
    ordersService.loadPendingBatch.and.returnValue(of(batch));
    const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRef.afterClosed.and.returnValue(of(null));
    dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);

    component.openRecap();

    expect(dialog.open).toHaveBeenCalledWith(jasmine.anything(), jasmine.objectContaining({ data: batch }));
  });

  it('signale une erreur si le chargement du lot échoue', () => {
    ordersService.loadPendingBatch.and.returnValue(throwError(() => new Error('boom')));

    component.openRecap();

    expect(snackBar.open).toHaveBeenCalledWith(
      'Erreur lors du chargement du lot',
      'OK',
      jasmine.any(Object),
    );
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('marque le lot comme transmis puis recharge la liste', () => {
    const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRef.afterClosed.and.returnValue(of(true));
    dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);
    ordersService.markSent.and.returnValue(of({ count: 3, batchId: 'batch-1' }));
    ordersService.loadOrders.and.returnValue(of([paidOrder]));

    component.confirmMarkSent();

    expect(ordersService.markSent).toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      '3 commande(s) marquée(s) comme transmises',
      'OK',
      jasmine.any(Object),
    );
  });

  it('ne marque rien si la confirmation est annulée', () => {
    const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRef.afterClosed.and.returnValue(of(false));
    dialog.open.and.returnValue(dialogRef as unknown as MatDialogRef<unknown>);

    component.confirmMarkSent();

    expect(ordersService.markSent).not.toHaveBeenCalled();
  });
});
