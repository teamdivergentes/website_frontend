import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ORDER_STATUS_LABELS, Order, OrderStatus } from '../../../shared/models/order.model';
import { OrdersService } from '../../../shared/services/orders.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { OrderDialogComponent } from './order-dialog.component';
import { RecapDialogComponent } from './recap-dialog.component';

@Component({
  selector: 'app-commandes-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './commandes-admin.component.html',
  styleUrls: ['./commandes-admin.component.scss'],
})
export class CommandesAdminComponent implements OnInit {
  private readonly ordersService = inject(OrdersService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly statusFilter = signal<OrderStatus | ''>('');

  readonly orders = this.ordersService.orders;
  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusEntries = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];

  readonly pendingCount = computed(() => this.orders().filter((o) => o.status === 'PAID').length);

  readonly filteredOrders = computed(() => {
    const filter = this.statusFilter();
    return filter ? this.orders().filter((o) => o.status === filter) : this.orders();
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  onStatusFilterChange(status: OrderStatus | ''): void {
    this.statusFilter.set(status);
  }

  openRecap(): void {
    this.ordersService.loadPendingBatch().subscribe({
      next: (batch) => {
        this.dialog.open(RecapDialogComponent, {
          width: '760px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          data: batch,
        });
      },
      error: () => {
        this.snackBar.open('Erreur lors du chargement du lot', 'OK', { duration: 3000 });
      },
    });
  }

  confirmMarkSent(): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '520px',
      data: {
        title: 'Marquer le lot comme transmis',
        message:
          "Confirmez uniquement après avoir envoyé le mail au marchand. Toutes les commandes payées passeront en « Transmise au marchand ».",
        confirmText: 'Marquer comme transmises',
        color: 'primary',
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.ordersService.markSent().subscribe({
        next: (result) => {
          this.snackBar.open(`${result.count} commande(s) marquée(s) comme transmises`, 'OK', {
            duration: 3000,
          });
          this.loadOrders();
        },
        error: () => {
          this.snackBar.open('Erreur lors du marquage du lot', 'OK', { duration: 3000 });
        },
      });
    });
  }

  openOrder(order: Order): void {
    const ref = this.dialog.open(OrderDialogComponent, {
      width: '620px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { order },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) {
        this.snackBar.open('Commande mise à jour', 'OK', { duration: 2500 });
      }
    });
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.ordersService.loadOrders().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Erreur lors du chargement des commandes', 'OK', { duration: 3000 });
      },
    });
  }
}
