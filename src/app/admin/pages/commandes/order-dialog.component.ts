import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ORDER_STATUS_LABELS, Order, OrderStatus } from '../../../shared/models/order.model';
import { OrdersService } from '../../../shared/services/orders.service';
import { FormActionsComponent } from '../../shared/form-actions.component';

interface OrderDialogData {
  order: Order;
}

@Component({
  selector: 'app-order-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormActionsComponent, 
    DecimalPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Commande {{ data.order.reference }}</h2>
    <mat-dialog-content>
      @if (error()) {
        <p class="error-banner">{{ error() }}</p>
      }

      <dl class="details">
        <dt>Articles</dt>
        <dd>
          <ul class="items">
            @for (item of data.order.items; track item.id) {
              <li>
                {{ item.productName }} — taille {{ item.size }} × {{ item.quantity }}
                <br />
                <!-- Le flocage est ce que l'équipe recopie pour le fabricant :
                     il ne doit jamais être noyé dans la ligne. -->
                <strong class="flocking">
                  @if (item.flockingText) {
                    Flocage : {{ item.flockingText }}
                  } @else {
                    Sans flocage
                  }
                </strong>
              </li>
            }
          </ul>
        </dd>
        <dt>Client</dt>
        <dd>{{ data.order.customerName }} ({{ data.order.customerEmail }})</dd>
        <dt>Adresse</dt>
        <dd>{{ formattedAddress }}</dd>
        <dt>Sous-total</dt>
        <dd>{{ data.order.subtotalCents / 100 | number: '1.2-2' }} €</dd>
        <dt>Livraison</dt>
        <dd>{{ data.order.shippingCents / 100 | number: '1.2-2' }} €</dd>
        <dt>Total</dt>
        <dd>{{ data.order.totalCents / 100 | number: '1.2-2' }} €</dd>
      </dl>

      <form [formGroup]="form" class="form">
        <mat-form-field>
          <mat-label>Statut</mat-label>
          <mat-select formControlName="status">
            @for (entry of statusEntries; track entry[0]) {
              <mat-option [value]="entry[0]">{{ entry[1] }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <mat-form-field>
          <mat-label>Numéro de suivi</mat-label>
          <input matInput formControlName="trackingNumber" />
        </mat-form-field>

        <mat-form-field>
          <mat-label>Note interne</mat-label>
          <textarea matInput rows="3" formControlName="adminNote"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <app-form-actions [saving]="saving()" (cancelled)="cancel()" (submitted)="save()" />
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: min(560px, 92vw);
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-top: 16px;
      }
      .details {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 4px 16px;
      }
      .details dt {
        font-weight: 600;
      }
      .items {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .items li + li {
        margin-top: 10px;
      }
      .flocking {
        color: #32d299;
        font-size: 0.9em;
      }
      .error-banner {
        color: #ff6b6b;
      }
    `,
  ],
})
export class OrderDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ordersService = inject(OrdersService);
  private readonly dialogRef = inject(MatDialogRef<OrderDialogComponent>);
  readonly data = inject<OrderDialogData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly statusEntries = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];

  readonly form: FormGroup = this.fb.group({
    status: [this.data.order.status, Validators.required],
    trackingNumber: [this.data.order.trackingNumber ?? ''],
    adminNote: [this.data.order.adminNote ?? ''],
  });

  get formattedAddress(): string {
    const address = this.data.order.shippingAddress?.address;
    if (!address?.line1) {
      return 'Adresse non renseignée';
    }
    return [address.line1, address.line2, `${address.postal_code ?? ''} ${address.city ?? ''}`.trim(), address.country]
      .filter(Boolean)
      .join(', ');
  }

  /** Ferme sans enregistrer. Remplace `mat-dialog-close`, que le pied
   * partage ne porte pas : il emet un evenement plutot qu'une directive. */
  cancel(): void {
    this.dialogRef.close(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(undefined);

    const raw = this.form.value as {
      status: OrderStatus;
      trackingNumber: string;
      adminNote: string;
    };

    this.ordersService
      .updateOrder(this.data.order.id, {
        status: raw.status,
        trackingNumber: raw.trackingNumber,
        adminNote: raw.adminNote,
      })
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.dialogRef.close(updated);
        },
        error: (err: { error?: { message?: string | string[] } }) => {
          this.saving.set(false);
          const message = err?.error?.message;
          this.error.set(
            Array.isArray(message)
              ? message.join(' — ')
              : (message ?? "Erreur lors de l'enregistrement."),
          );
        },
      });
  }
}
