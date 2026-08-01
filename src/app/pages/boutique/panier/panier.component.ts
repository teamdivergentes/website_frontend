import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../../shared/services/shop.service';
import { CartService } from '../../../shared/services/cart.service';
import { SeoService } from '../../../shared/services/seo.service';
import { SHOP_LEGAL, orMissing } from '../../legal/legal-info';
import { ShippingMethod } from '../../../shared/models/shop-product.model';

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
  readonly shippingMethod = this.cartService.shippingMethod;
  readonly shippingIsFree = this.cartService.shippingIsFree;
  readonly missingForFreeShippingCents = this.cartService.missingForFreeShippingCents;
  readonly shippingStandardCents = this.shopService.shippingStandardCents;
  readonly shippingExpressCents = this.shopService.shippingExpressCents;
  readonly freeShippingThresholdCents = this.shopService.freeShippingThresholdCents;

  /** La franchise ne s'affiche que si un seuil est réglé. */
  readonly showsFreeShipping = computed(() => this.freeShippingThresholdCents() > 0);

  /**
   * Progression vers la franchise, en pourcentage. Un montant restant ne dit
   * pas si l'on en est proche ; la jauge le montre d'un coup d'œil.
   */
  readonly freeShippingPercent = computed(() => {
    const threshold = this.freeShippingThresholdCents();
    if (threshold <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((this.subtotalCents() / threshold) * 100));
  });

  selectShippingMethod(method: ShippingMethod): void {
    this.cartService.setShippingMethod(method);
  }

  /**
   * Délais annoncés au panier : le délai de livraison engage le vendeur
   * (art. L216-1 C. conso), il doit donc être visible avant le paiement. Tant
   * qu'il n'est pas renseigné, le marqueur « à compléter » s'affiche.
   */
  readonly shippingDelay = orMissing(
    SHOP_LEGAL.shippingDelayBusinessDays === null
      ? null
      : `${SHOP_LEGAL.shippingDelayBusinessDays} jours ouvrés`,
    "délai d'expédition, en jours ouvrés",
  );

  readonly carrierDelay = orMissing(
    SHOP_LEGAL.carrierDelayBusinessDays === null
      ? null
      : `${SHOP_LEGAL.carrierDelayBusinessDays} jours ouvrés`,
    "délai d'acheminement, en jours ouvrés",
  );

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | undefined>(undefined);
  readonly termsAccepted = signal(false);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Panier',
      description: 'Votre panier — boutique officielle Team Divergentes.',
      url: '/boutique2/panier',
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
        shippingMethod: this.shippingMethod(),
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
