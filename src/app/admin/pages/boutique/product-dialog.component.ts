import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { AdminShopProduct, UpsertShopProductDto } from '../../../shared/models/shop-admin.model';
import { ShopAdminService } from '../../../shared/services/shop-admin.service';
import { eurosToCents } from './boutique-admin.component';

interface ProductDialogData {
  product: AdminShopProduct | null;
}

@Component({
  selector: 'app-product-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSlideToggleModule,
    ImageUploadComponent,
  ],
  templateUrl: './product-dialog.component.html',
  styleUrls: ['./product-dialog.component.scss'],
})
export class ProductDialogComponent {
  private readonly shopAdmin = inject(ShopAdminService);
  private readonly dialogRef = inject(MatDialogRef<ProductDialogComponent>);
  readonly data = inject<ProductDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = this.data.product !== null;
  readonly saving = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly slug = signal(this.data.product?.slug ?? '');
  readonly name = signal(this.data.product?.name ?? '');
  readonly shortDescription = signal(this.data.product?.shortDescription ?? '');
  readonly description = signal(this.data.product?.description ?? '');
  readonly priceEuros = signal(centsToEuros(this.data.product?.priceCents ?? 0));
  readonly imageFront = signal(this.data.product?.imageFront ?? '');
  readonly imageBack = signal(this.data.product?.imageBack ?? '');
  readonly allowFlocking = signal(this.data.product?.allowFlocking ?? true);
  readonly flockingFeeEuros = signal(centsToEuros(this.data.product?.flockingFeeCents ?? 0));
  readonly sizesCsv = signal(
    (this.data.product?.sizes ?? []).map((s) => s.label).join(', ') || 'S, M, L, XL, XXL',
  );
  readonly position = signal(this.data.product?.position ?? 0);

  readonly canSave = computed(
    () =>
      this.name().trim().length > 0 &&
      (this.isEdit || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(this.slug().trim())) &&
      eurosToCents(this.priceEuros()) !== null &&
      eurosToCents(this.flockingFeeEuros()) !== null &&
      this.parsedSizes().length > 0,
  );

  parsedSizes(): string[] {
    return this.sizesCsv()
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);
  }

  onFrontUploaded(url: string): void {
    this.imageFront.set(url);
  }

  onBackUploaded(url: string): void {
    this.imageBack.set(url);
  }

  save(): void {
    const priceCents = eurosToCents(this.priceEuros());
    const flockingFeeCents = eurosToCents(this.flockingFeeEuros());
    if (priceCents === null || flockingFeeCents === null) {
      this.error.set('Les montants doivent être des nombres valides.');
      return;
    }

    const dto: UpsertShopProductDto = {
      name: this.name().trim(),
      shortDescription: this.shortDescription().trim(),
      description: this.description().trim(),
      priceCents,
      imageFront: this.imageFront().trim(),
      imageBack: this.imageBack().trim(),
      allowFlocking: this.allowFlocking(),
      // Un surcout n'a pas de sens si le flocage est desactive.
      flockingFeeCents: this.allowFlocking() ? flockingFeeCents : 0,
      sizes: this.parsedSizes(),
      position: Number(this.position()),
    };

    this.saving.set(true);
    this.error.set(undefined);

    const request = this.isEdit
      ? this.shopAdmin.update(this.data.product!.id, dto)
      : this.shopAdmin.create({ ...dto, slug: this.slug().trim() });

    request.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err: { error?: { message?: string | string[] } }) => {
        this.saving.set(false);
        const message = err?.error?.message;
        this.error.set(
          Array.isArray(message)
            ? message.join(' — ')
            : (message ?? "L'enregistrement a échoué."),
        );
      },
    });
  }
}

function centsToEuros(cents: number): string {
  return (cents / 100).toFixed(2);
}
