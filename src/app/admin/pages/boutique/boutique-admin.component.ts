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

  /**
   * Saisies en euros : les centimes sont un detail de stockage, pas
   * d'interface. Chaque champ a son jumeau « enregistre », pour savoir ce qui
   * reste a envoyer sans redemander au serveur.
   */
  readonly form = {
    shippingStandard: signal('0.00'),
    freeShippingThreshold: signal('0.00'),
    costProduction: signal('0.00'),
    costPartner: signal('0.00'),
    costEcommerce: signal('0.00'),
    costFlocking: signal('0.00'),
    costShippingStandard: signal('0.00'),
    notifyEmail: signal(''),
  };

  /** Interrupteur du partenariat : desactive au lancement, activable a tout moment. */
  readonly costPartnerEnabled = signal(false);

  private readonly saved = signal<Record<string, string>>({});

  readonly settingsDirty = computed(() => {
    const saved = this.saved();
    return Object.entries(this.form).some(
      ([cle, champ]) => champ().trim() !== (saved[cle] ?? ''),
    );
  });

  /**
   * Cout d'un maillot tel qu'il sera fige sur les prochaines commandes.
   * Affiche en direct : une grille de couts ne se verifie qu'en voyant son
   * total, et le partenariat pese assez pour qu'on voie l'effet de
   * l'interrupteur avant d'enregistrer.
   */
  readonly unitCostCents = computed(() => {
    const lire = (champ: () => string) => eurosToCents(champ()) ?? 0;
    return (
      lire(this.form.costProduction) +
      (this.costPartnerEnabled() ? lire(this.form.costPartner) : 0) +
      lire(this.form.costEcommerce) +
      lire(this.form.costFlocking)
    );
  });

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

  /** La vignette du catalogue : celle marquée vitrine, sinon la première vue. */
  cardImage(product: AdminShopProduct): string | null {
    const card = product.images.find((image) => image.isCard) ?? product.images[0];
    return card?.url ?? null;
  }

  toggleActive(product: AdminShopProduct, active: boolean): void {
    // Publier un produit sans aucun visuel donnerait une fiche vide en vitrine.
    if (active && product.images.length === 0) {
      this.snackBar.open(
        'Ajoutez au moins un visuel avant de publier ce produit.',
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
    const montants: Record<string, number> = {};
    const champsMontants = {
      shippingStandardCents: this.form.shippingStandard,
      freeShippingThresholdCents: this.form.freeShippingThreshold,
      costProductionCents: this.form.costProduction,
      costPartnerCents: this.form.costPartner,
      costEcommerceCents: this.form.costEcommerce,
      costFlockingCents: this.form.costFlocking,
      costShippingStandardCents: this.form.costShippingStandard,
    };

    for (const [cle, champ] of Object.entries(champsMontants)) {
      const cents = eurosToCents(champ());
      if (cents === null) {
        this.snackBar.open('Tous les montants doivent être valides', 'Fermer', { duration: 4000 });
        return;
      }
      montants[cle] = cents;
    }

    this.savingSettings.set(true);
    this.shopAdmin
      .updateSettings({
        ...montants,
        costPartnerEnabled: this.costPartnerEnabled(),
        ordersNotifyEmail: this.form.notifyEmail().trim(),
      })
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
    this.costPartnerEnabled.set(settings.costPartnerEnabled);

    const valeurs: Record<string, string> = {
      shippingStandard: centsToEuros(settings.shippingStandardCents),
      freeShippingThreshold: centsToEuros(settings.freeShippingThresholdCents),
      costProduction: centsToEuros(settings.costProductionCents),
      costPartner: centsToEuros(settings.costPartnerCents),
      costEcommerce: centsToEuros(settings.costEcommerceCents),
      costFlocking: centsToEuros(settings.costFlockingCents),
      costShippingStandard: centsToEuros(settings.costShippingStandardCents),
      notifyEmail: settings.ordersNotifyEmail ?? '',
    };

    for (const [cle, valeur] of Object.entries(valeurs)) {
      (this.form as Record<string, ReturnType<typeof signal<string>>>)[cle].set(valeur);
    }
    this.saved.set(valeurs);
  }
}

/**
 * Convertit une saisie en euros vers des centimes.
 * Retourne `null` sur une saisie invalide plutot que `NaN` : l'appelant doit
 * distinguer « zero » de « illisible ».
 */
export function centsToEuros(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function eurosToCents(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }
  return Math.round(Number.parseFloat(normalized) * 100);
}
