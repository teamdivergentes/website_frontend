import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import {
  AdminShopProduct,
  UpsertShopProductDto,
  UpsertShopProductImage,
} from '../../../shared/models/shop-admin.model';
import { ShopAdminService } from '../../../shared/services/shop-admin.service';
import { eurosToCents } from './boutique-admin.component';

interface ProductDialogData {
  product: AdminShopProduct | null;
}

/** Un visuel en cours d'édition dans la modale. */
export interface GalleryDraft {
  url: string;
  label: string;
  /** Vue de dos : c'est sur elle que se pose l'aperçu du flocage. */
  isBack: boolean;
  /** Vignette de la liste boutique. Une seule à la fois. */
  isCard: boolean;
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
  readonly images = signal<GalleryDraft[]>(
    (this.data.product?.images ?? []).map((image) => ({
      url: image.url,
      label: image.label,
      isBack: image.isBack,
      isCard: image.isCard,
    })),
  );
  // --- Promotion ---------------------------------------------------------
  //
  // Le prix catalogue ne bouge pas pendant une promotion : c'est ce qui permet
  // d'afficher le prix barré, de restituer le tarif normal à l'échéance sans
  // intervention, et de rester conforme à l'obligation d'annoncer un prix de
  // référence réellement pratiqué (art. L112-1-1 C. conso).

  /** Vide = pas de promotion. Le vider met fin à celle qui court. */
  readonly promoPriceEuros = signal(
    this.data.product?.promoPriceCents == null
      ? ''
      : centsToEuros(this.data.product.promoPriceCents),
  );
  readonly promoStartsAt = signal(toDateInput(this.data.product?.promoStartsAt));
  readonly promoEndsAt = signal(toDateInput(this.data.product?.promoEndsAt));

  /**
   * Le refus est affiché avant l'envoi plutôt qu'après le retour du serveur :
   * une promotion au-dessus du prix catalogue s'enregistrerait sans effet
   * visible, ce qui est la pire des confirmations.
   */
  readonly promoError = computed(() => {
    const promo = this.promoPriceEuros().trim();
    if (promo.length === 0) {
      return undefined;
    }

    const promoCents = eurosToCents(promo);
    const priceCents = eurosToCents(this.priceEuros());
    if (promoCents === null) {
      return 'Le prix promotionnel doit être un nombre valide.';
    }
    if (priceCents !== null && promoCents >= priceCents) {
      return 'Le prix promotionnel doit être inférieur au prix catalogue.';
    }
    if (this.promoStartsAt() && this.promoEndsAt() && this.promoEndsAt() <= this.promoStartsAt()) {
      return 'La fin de la promotion doit être postérieure à son début.';
    }
    return undefined;
  });

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
      this.promoError() === undefined &&
      this.parsedSizes().length > 0,
  );

  parsedSizes(): string[] {
    return this.sizesCsv()
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter((s) => s.length > 0);
  }

  /**
   * Ajoute le visuel qui vient d'être téléversé en fin de galerie. Le libellé
   * proposé suit le rang plutôt que de rester vide : un champ obligatoire vide
   * bloquerait l'enregistrement sans que la cause soit visible.
   */
  onImageUploaded(url: string): void {
    this.images.update((images) => {
      if (images.some((image) => image.url === url)) {
        return images;
      }
      return [
        ...images,
        {
          url,
          label: `vue ${images.length + 1}`,
          isBack: false,
          // Le premier visuel fait la vitrine tant qu'aucun autre n'est désigné.
          isCard: images.length === 0,
        },
      ];
    });
  }

  updateLabel(index: number, label: string): void {
    this.images.update((images) =>
      images.map((image, i) => (i === index ? { ...image, label } : image)),
    );
  }

  toggleBack(index: number, isBack: boolean): void {
    this.images.update((images) =>
      images.map((image, i) => (i === index ? { ...image, isBack } : image)),
    );
  }

  /** La vitrine est exclusive : désigner une image libère la précédente. */
  setCard(index: number): void {
    this.images.update((images) => images.map((image, i) => ({ ...image, isCard: i === index })));
  }

  moveImage(index: number, delta: number): void {
    const target = index + delta;
    this.images.update((images) => {
      if (target < 0 || target >= images.length) {
        return images;
      }
      const reordered = [...images];
      [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
      return reordered;
    });
  }

  /**
   * Retire le visuel de la galerie sans toucher au fichier : le même téléversement
   * peut servir ailleurs, et les visuels livrés avec le site appartiennent au
   * dépôt, pas à l'administration.
   */
  removeImage(index: number): void {
    this.images.update((images) => {
      const remaining = images.filter((_, i) => i !== index);
      if (remaining.length > 0 && !remaining.some((image) => image.isCard)) {
        // La vitrine ne peut pas disparaître avec l'image supprimée.
        remaining[0] = { ...remaining[0], isCard: true };
      }
      return remaining;
    });
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
      // `null` explicite et non champ omis : c'est ce qui met fin à une
      // promotion. Un champ absent laisserait la précédente en place.
      promoPriceCents: eurosToCents(this.promoPriceEuros().trim()),
      promoStartsAt: fromDateInput(this.promoStartsAt()),
      promoEndsAt: fromDateInput(this.promoEndsAt(), 'end'),
      images: this.images()
        .filter((image) => image.url.trim().length > 0 && image.label.trim().length > 0)
        .map<UpsertShopProductImage>((image) => ({
          url: image.url.trim(),
          label: image.label.trim(),
          isBack: image.isBack,
          isCard: image.isCard,
        })),
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

/** Un instant ISO vers la valeur d'un `<input type="date">`. */
function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : '';
}

/**
 * Une date saisie vers l'instant ISO envoyé au serveur.
 *
 * ⚠️ **La fin de promotion tombe en fin de journée, pas à son début.** Un
 * administrateur qui saisit « jusqu'au 31 août » veut que la promotion coure
 * pendant le 31 ; la borner à `00:00` l'arrêterait la veille au soir, et le
 * défaut ne se verrait que le jour dit.
 *
 * L'heure est fixée en UTC et non dans le fuseau du navigateur : les deux
 * bornes doivent désigner le même instant quel que soit l'endroit d'où on
 * édite, et c'est en UTC que le serveur les compare.
 */
function fromDateInput(value: string, edge: 'start' | 'end' = 'start'): string | null {
  const day = value.trim();
  if (day.length === 0) {
    return null;
  }
  return `${day}T${edge === 'end' ? '23:59:59.999' : '00:00:00.000'}Z`;
}
