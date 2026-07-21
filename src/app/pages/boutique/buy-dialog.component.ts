import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DecimalPipe } from '@angular/common';
import { ShopProduct } from '../../shared/models/shop-product.model';
import { ShopService } from '../../shared/services/shop.service';

interface BuyDialogData {
  product: ShopProduct;
}

@Component({
  selector: 'app-buy-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.product.name }}</h2>
    <mat-dialog-content>
      @if (error()) {
        <p class="error-banner" role="alert">{{ error() }}</p>
      }

      <p class="price">{{ data.product.priceCents / 100 | number: '1.2-2' }} € l'unité</p>

      <form [formGroup]="form" class="form">
        @if (data.product.sizes.length > 0) {
          <mat-form-field>
            <mat-label>Taille</mat-label>
            <mat-select formControlName="size">
              @for (size of data.product.sizes; track size) {
                <mat-option [value]="size">{{ size }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        }

        <mat-form-field>
          <mat-label>Quantité</mat-label>
          <input matInput type="number" min="1" max="10" formControlName="quantity" />
        </mat-form-field>
      </form>

      <p class="shipping-hint">
        L'adresse de livraison et les frais de port sont renseignés à l'étape suivante, sur la
        page de paiement sécurisée.
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Annuler</button>
      <button mat-raised-button color="primary" [disabled]="submitting()" (click)="pay()">
        {{ submitting() ? 'Redirection…' : 'Payer' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: min(420px, 92vw);
      }
      .form {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .price {
        font-size: 1.2rem;
        font-weight: 600;
      }
      .shipping-hint {
        font-size: 0.85rem;
        opacity: 0.75;
      }
      .error-banner {
        color: #ff6b6b;
      }
    `,
  ],
})
export class BuyDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly shopService = inject(ShopService);
  private readonly dialogRef = inject(MatDialogRef<BuyDialogComponent>);
  readonly data = inject<BuyDialogData>(MAT_DIALOG_DATA);

  readonly submitting = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly form: FormGroup = this.fb.group({
    size: [
      this.data.product.sizes[0] ?? null,
      this.data.product.sizes.length > 0 ? Validators.required : [],
    ],
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(10)]],
  });

  pay(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.error.set(undefined);

    const raw = this.form.value as { size: string | null; quantity: number };
    const payload = {
      productId: this.data.product.id,
      quantity: Number(raw.quantity),
      ...(this.data.product.sizes.length > 0 && raw.size ? { size: raw.size } : {}),
    };

    this.shopService.createCheckout(payload).subscribe({
      next: (result) => {
        this.dialogRef.close(true);
        this.redirectToCheckout(result.url);
      },
      error: (err: { error?: { message?: string | string[] } }) => {
        this.submitting.set(false);
        const message = err?.error?.message;
        this.error.set(
          Array.isArray(message)
            ? message.join(' — ')
            : (message ?? 'Le paiement est momentanément indisponible. Réessayez plus tard.'),
        );
      },
    });
  }

  /**
   * Redirection reelle vers Stripe Checkout, isolee dans une methode dediee
   * pour rester spyable dans les tests (window.location.href provoque un
   * rechargement complet de page qui deconnecte le runner Karma).
   */
  redirectToCheckout(url: string): void {
    window.location.href = url;
  }
}
