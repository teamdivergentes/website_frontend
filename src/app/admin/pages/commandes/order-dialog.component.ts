import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ORDER_STATUS_LABELS, Order, OrderStatus } from '../../../shared/models/order.model';
import { OrdersService } from '../../../shared/services/orders.service';
import { AuthService } from '../../../../shared/services/api/auth.service';
import { FormActionsComponent } from '../../shared/form-actions.component';

/**
 * Statuts sur lesquels un remboursement n'a pas de sens : jamais payée
 * (`PENDING`), déjà remboursée, ou déjà annulée. Doit rester alignée avec la
 * règle serveur — c'est lui qui tranche au 409, ce calcul ne fait que
 * désactiver un bouton qui échouerait de toute façon.
 */
const NON_REFUNDABLE_STATUSES: ReadonlySet<OrderStatus> = new Set([
  'PENDING',
  'REFUNDED',
  'CANCELLED',
]);

interface OrderDialogData {
  order: Order;
}

@Component({
  selector: 'app-order-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormActionsComponent,
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>Commande {{ order().reference }}</h2>
    <mat-dialog-content>
      @if (error()) {
        <p class="error-banner">{{ error() }}</p>
      }
      @if (refundError()) {
        <p class="error-banner">{{ refundError() }}</p>
      }

      <dl class="details">
        <dt>Articles</dt>
        <dd>
          <ul class="items">
            @for (item of order().items; track item.id) {
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
        <dd>{{ order().customerName }} ({{ order().customerEmail }})</dd>
        <!-- Le prenom et le nom declares par le client, quand ils different du
             nom porte par l'adresse de livraison. C'est precisement cet ecart
             qui trahit une saisie douteuse sur l'etiquette : l'afficher quand
             les deux concordent n'apprendrait rien et allongerait la fiche. -->
        @if (declaredIdentity(); as identity) {
          <dt>Identite declaree</dt>
          <dd>{{ identity }}</dd>
        }
        <dt>Adresse</dt>
        <dd>{{ formattedAddress }}</dd>
        <dt>Sous-total</dt>
        <dd>{{ order().subtotalCents / 100 | number: '1.2-2' }} €</dd>
        <dt>Livraison</dt>
        <dd>{{ order().shippingCents / 100 | number: '1.2-2' }} €</dd>
        <dt>Total</dt>
        <dd>{{ order().totalCents / 100 | number: '1.2-2' }} €</dd>
        @if (order().status === 'REFUNDED') {
          <dt>Remboursement</dt>
          <dd>
            Remboursée{{ order().refundedAt ? ' le ' + (order().refundedAt | date: 'dd/MM/yyyy à HH:mm') : '' }}
          </dd>
        }
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

      <!-- Remboursement : bouton visible avec la permission, désactivé hors
           statut remboursable, confirmation explicite affichant le montant
           avant tout appel réseau. -->
      @if (canRefund()) {
        <div class="refund">
          @if (!confirmingRefund()) {
            <button
              mat-stroked-button
              color="warn"
              type="button"
              [disabled]="!isRefundable() || refunding()"
              (click)="confirmingRefund.set(true)">
              Rembourser
            </button>
            @if (!isRefundable()) {
              <p class="refund__hint">
                Cette commande n'est pas remboursable dans son statut actuel.
              </p>
            }
          } @else {
            <div class="refund__confirm" role="alertdialog" aria-label="Confirmer le remboursement">
              <p>
                Rembourser <strong>{{ order().totalCents / 100 | number: '1.2-2' }} €</strong> au
                client ? Cette action déclenche un remboursement Stripe immédiat.
              </p>
              <div class="refund__confirm-actions">
                <button mat-button type="button" (click)="confirmingRefund.set(false)">
                  Annuler
                </button>
                <button
                  mat-raised-button
                  color="warn"
                  type="button"
                  [disabled]="refunding()"
                  (click)="refund()">
                  {{ refunding() ? 'Remboursement…' : 'Confirmer le remboursement' }}
                </button>
              </div>
            </div>
          }
        </div>
      }
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
        gap: var(--admin-space-2);
        margin-top: 16px;
      }
      .details {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: var(--admin-space-1) var(--admin-space-4);
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
        color: var(--admin-accent);
        font-size: 0.9em;
      }
      .error-banner {
        color: var(--admin-danger);
      }
      .refund {
        margin-top: var(--admin-space-4);
        padding-top: var(--admin-space-3);
        border-top: 1px solid rgb(255 255 255 / 10%);
      }
      .refund__hint {
        margin: 6px 0 0;
        font-size: 0.85em;
        color: var(--text-dim);
      }
      .refund__confirm {
        padding: var(--admin-space-3);
        border: 1px solid var(--admin-danger);
        border-radius: var(--admin-radius-xs, 4px);
      }
      .refund__confirm-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--admin-space-2);
        margin-top: var(--admin-space-2);
      }
    `,
  ],
})
export class OrderDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly ordersService = inject(OrdersService);
  private readonly authService = inject(AuthService);
  private readonly dialogRef = inject(MatDialogRef<OrderDialogComponent>);
  readonly data = inject<OrderDialogData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly error = signal<string | undefined>(undefined);

  /**
   * La commande affichée, distincte de `data.order` : un remboursement la met
   * à jour (statut, `refundedAt`) sans fermer le dialogue, pour que l'admin
   * voie le résultat de son action au lieu de deviner si elle a marché.
   */
  readonly order = signal(this.data.order);

  readonly statusEntries = Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][];

  readonly form: FormGroup = this.fb.group({
    status: [this.data.order.status, Validators.required],
    trackingNumber: [this.data.order.trackingNumber ?? ''],
    adminNote: [this.data.order.adminNote ?? ''],
  });

  /**
   * Prenom et nom declares, affiches uniquement quand ils s'ecartent du nom de
   * l'adresse de livraison.
   *
   * C'est l'ecart qui porte l'information : « Jean Dupont » declare face a un
   * « jean dupont » d'adresse ne merite pas une ligne, alors qu'un « Jean
   * Dupont » face a un pseudo signale une etiquette a verifier avant de
   * transmettre le lot au fabricant. La comparaison ignore la casse et les
   * espaces multiples, seuls ecarts qui ne disent rien.
   */
  readonly declaredIdentity = computed<string | null>(() => {
    const order = this.order();
    const declared = [order.customerFirstName, order.customerLastName]
      .map((part) => (part ?? '').trim())
      .filter((part) => part.length > 0)
      .join(' ');

    if (declared.length === 0) {
      return null;
    }

    const normalise = (value: string): string =>
      value.trim().toLocaleLowerCase('fr-FR').replace(/\s+/g, ' ');

    return normalise(declared) === normalise(order.customerName ?? '') ? null : declared;
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

  // ----------------------------------------------------------------
  // Remboursement
  // ----------------------------------------------------------------

  /** Visible seulement avec la permission d'écriture sur les commandes. */
  readonly canRefund = computed(() => this.authService.hasPermission('commandes:write'));

  readonly isRefundable = computed(
    () => !NON_REFUNDABLE_STATUSES.has(this.order().status),
  );

  readonly confirmingRefund = signal(false);
  readonly refunding = signal(false);
  readonly refundError = signal<string | undefined>(undefined);

  refund(): void {
    if (!this.isRefundable() || this.refunding()) {
      return;
    }
    this.refunding.set(true);
    this.refundError.set(undefined);

    this.ordersService.refundOrder(this.order().id).subscribe({
      next: (updated) => {
        this.refunding.set(false);
        this.confirmingRefund.set(false);
        this.order.set(updated);
      },
      error: (err: { error?: { message?: string | string[] } }) => {
        this.refunding.set(false);
        const message = err?.error?.message;
        this.refundError.set(
          Array.isArray(message) ? message.join(' — ') : (message ?? 'Le remboursement a échoué.'),
        );
      },
    });
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
      .updateOrder(this.order().id, {
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
