import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../../shared/services/shop.service';
import { CartService } from '../../../shared/services/cart.service';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
  selector: 'app-boutique-panier',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanierComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly shopService = inject(ShopService);
  private readonly seoService = inject(SeoService);

  readonly lines = this.cartService.detailedLines;
  readonly subtotalCents = this.cartService.subtotalCents;
  readonly shippingCents = this.cartService.shippingCents;
  readonly totalCents = this.cartService.totalCents;

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | undefined>(undefined);
  readonly termsAccepted = signal(false);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Panier',
      description: 'Votre panier — boutique officielle Team Divergentes.',
      url: '/boutique/panier',
    });

    // Le catalogue porte les prix : sans lui, le panier ne peut rien afficher.
    this.shopService.loadCatalog().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set('La boutique est momentanément indisponible.');
      },
    });
  }

  updateQuantity(index: number, quantity: number): void {
    this.cartService.updateQuantity(index, quantity);
  }

  remove(index: number): void {
    this.cartService.remove(index);
  }

  checkout(): void {
    const lines = this.lines();
    if (lines.length === 0 || !this.termsAccepted() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(undefined);

    // Aucun montant n'est transmis : le serveur les recalcule depuis sa base.
    this.shopService
      .createCheckout({
        items: lines.map((line) => ({
          productId: line.productId,
          size: line.size,
          quantity: line.quantity,
          ...(line.flockingText ? { flockingText: line.flockingText } : {}),
        })),
      })
      .subscribe({
        next: (result) => this.redirectToCheckout(result.url),
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
   * Redirection reelle vers Stripe Checkout, isolee pour rester spyable dans
   * les tests : une affectation de location.href recharge la page et
   * deconnecte le runner Karma.
   */
  redirectToCheckout(url: string): void {
    globalThis.location.href = url;
  }
}
