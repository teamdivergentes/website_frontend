import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AdminShopProduct, ShopSettings } from '../../../shared/models/shop-admin.model';
import { ShopAdminService } from '../../../shared/services/shop-admin.service';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { ProductDialogComponent } from './product-dialog.component';

@Component({
  selector: 'app-boutique-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatSlideToggleModule],
  templateUrl: './boutique-admin.component.html',
  styleUrls: ['./boutique-admin.component.scss'],
})
export class BoutiqueAdminComponent implements OnInit {
  private readonly shopAdmin = inject(ShopAdminService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly products = signal<AdminShopProduct[]>([]);
  readonly settings = signal<ShopSettings | null>(null);
  readonly loading = signal(true);
  readonly savingSettings = signal(false);

  /** Saisie en euros : les centimes sont un detail de stockage, pas d'interface. */
  readonly shippingFeeEuros = signal('0.00');
  readonly notifyEmail = signal('');

  /**
   * Valeurs telles qu'elles sont en base, pour savoir ce qui reste a envoyer.
   * Tout le reste de l'ecran (ouverture de la boutique, catalogue) s'enregistre
   * a la volee : seuls ces deux champs passent par un bouton, et rien ne le
   * signalait.
   */
  private readonly savedShippingFeeEuros = signal('0.00');
  private readonly savedNotifyEmail = signal('');

  readonly settingsDirty = computed(
    () =>
      this.shippingFeeEuros().trim() !== this.savedShippingFeeEuros() ||
      this.notifyEmail().trim() !== this.savedNotifyEmail(),
  );

  ngOnInit(): void {
    this.loadAll();
  }

  // ----------------------------------------------------------------
  // Catalogue
  // ----------------------------------------------------------------

  openCreate(): void {
    this.openProductDialog(null);
  }

  openEdit(product: AdminShopProduct): void {
    this.openProductDialog(product);
  }

  toggleActive(product: AdminShopProduct, active: boolean): void {
    // Publier un produit sans visuel de face donnerait une fiche vide en vitrine.
    if (active && !product.imageFront) {
      this.snackBar.open(
        'Ajoutez un visuel de face avant de publier ce produit.',
        'Fermer',
        { duration: 5000 },
      );
      this.loadProducts();
      return;
    }

    this.shopAdmin.update(product.id, { active }).subscribe({
      next: () => {
        this.loadProducts();
        this.snackBar.open(active ? 'Produit publié' : 'Produit retiré de la vitrine', 'Fermer', {
          duration: 3000,
        });
      },
      error: () => this.snackBar.open('La mise à jour a échoué', 'Fermer', { duration: 4000 }),
    });
  }

  confirmDelete(product: AdminShopProduct): void {
    this.dialog
      .open(ConfirmDialogComponent, {
        data: {
          title: 'Supprimer le produit',
          message: `Supprimer « ${product.name} » ? Les commandes déjà passées conservent leur libellé et leur prix.`,
          confirmText: 'Supprimer',
        },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.shopAdmin.remove(product.id).subscribe({
          next: () => {
            this.loadProducts();
            this.snackBar.open('Produit supprimé', 'Fermer', { duration: 3000 });
          },
          error: () =>
            this.snackBar.open('La suppression a échoué', 'Fermer', { duration: 4000 }),
        });
      });
  }

  // ----------------------------------------------------------------
  // Réglages
  // ----------------------------------------------------------------

  saveSettings(): void {
    const shippingFeeCents = eurosToCents(this.shippingFeeEuros());
    if (shippingFeeCents === null) {
      this.snackBar.open('Les frais de port doivent être un montant valide', 'Fermer', {
        duration: 4000,
      });
      return;
    }

    this.savingSettings.set(true);
    this.shopAdmin
      .updateSettings({ shippingFeeCents, ordersNotifyEmail: this.notifyEmail().trim() })
      .subscribe({
        next: (settings) => {
          this.applySettings(settings);
          this.savingSettings.set(false);
          this.snackBar.open('Réglages enregistrés', 'Fermer', { duration: 3000 });
        },
        error: (err: { error?: { message?: string | string[] } }) => {
          this.savingSettings.set(false);
          const message = err?.error?.message;
          this.snackBar.open(
            Array.isArray(message) ? message.join(' — ') : (message ?? 'Enregistrement impossible'),
            'Fermer',
            { duration: 5000 },
          );
        },
      });
  }

  toggleShop(shopEnabled: boolean): void {
    this.shopAdmin.updateSettings({ shopEnabled }).subscribe({
      next: (settings) => {
        this.applySettings(settings);
        this.snackBar.open(shopEnabled ? 'Boutique ouverte' : 'Boutique fermée', 'Fermer', {
          duration: 3000,
        });
      },
      error: () => this.snackBar.open('La mise à jour a échoué', 'Fermer', { duration: 4000 }),
    });
  }

  // ----------------------------------------------------------------

  private openProductDialog(product: AdminShopProduct | null): void {
    this.dialog
      .open(ProductDialogComponent, {
        width: '720px',
        maxWidth: '95vw',
        data: { product },
      })
      .afterClosed()
      .subscribe((saved) => {
        if (saved) {
          this.loadProducts();
        }
      });
  }

  private loadAll(): void {
    this.loading.set(true);
    this.loadProducts();
    this.shopAdmin.getSettings().subscribe({
      next: (settings) => this.applySettings(settings),
      error: () => this.snackBar.open('Réglages indisponibles', 'Fermer', { duration: 4000 }),
    });
  }

  private loadProducts(): void {
    this.shopAdmin.findAll().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Catalogue indisponible', 'Fermer', { duration: 4000 });
      },
    });
  }

  private applySettings(settings: ShopSettings): void {
    this.settings.set(settings);
    const shippingFee = (settings.shippingFeeCents / 100).toFixed(2);
    const email = settings.ordersNotifyEmail ?? '';

    this.shippingFeeEuros.set(shippingFee);
    this.notifyEmail.set(email);
    this.savedShippingFeeEuros.set(shippingFee);
    this.savedNotifyEmail.set(email);
  }
}

/**
 * Convertit une saisie en euros vers des centimes.
 * Retourne `null` sur une saisie invalide plutot que `NaN` : l'appelant doit
 * distinguer « zero » de « illisible ».
 */
export function eurosToCents(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  return Math.round(Number.parseFloat(normalized) * 100);
}
