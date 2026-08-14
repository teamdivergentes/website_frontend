import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../shared/services/cart.service';
import { ShopService } from '../../../shared/services/shop.service';

/**
 * Accès permanent au panier, tant qu'il contient quelque chose.
 *
 * Le lien de bas de page ne se voyait qu'une fois la liste parcourue : sur la
 * fiche produit, rien ne rappelait qu'un maillot attendait déjà. La pastille
 * suit donc le défilement, et se signale à chaque ajout plutôt que de compter
 * sur l'attention du visiteur.
 */
@Component({
  selector: 'app-cart-fab',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './cart-fab.component.html',
  styleUrls: ['./cart-fab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartFabComponent {
  private readonly cartService = inject(CartService);
  private readonly shopService = inject(ShopService);
  private readonly destroyRef = inject(DestroyRef);

  readonly count = this.cartService.itemCount;
  readonly subtotalCents = this.cartService.subtotalCents;
  readonly missingCents = this.cartService.missingForFreeShippingCents;
  readonly shippingIsFree = this.cartService.shippingIsFree;

  /** Vrai le temps d'un battement, à chaque article ajouté. */
  readonly bumping = signal(false);

  /**
   * Progression vers la franchise de port, en pourcentage. Un montant restant
   * ne dit pas si l'on est près du but ; la barre le montre d'un coup d'œil.
   */
  readonly progressPercent = computed(() => {
    const threshold = this.shopService.freeShippingThresholdCents();
    if (threshold <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((this.subtotalCents() / threshold) * 100));
  });

  /** La franchise n'a de sens que si un seuil est réglé. */
  readonly showsFreeShipping = computed(() => this.shopService.freeShippingThresholdCents() > 0);

  private previousCount = this.cartService.itemCount();
  private bumpTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    effect(() => {
      const count = this.count();
      // Seule une hausse se signale : retirer un article n'a pas à clignoter.
      if (count > this.previousCount) {
        this.bump();
      }
      this.previousCount = count;
    });

    this.destroyRef.onDestroy(() => clearTimeout(this.bumpTimer));
  }

  private bump(): void {
    clearTimeout(this.bumpTimer);
    this.bumping.set(true);
    this.bumpTimer = setTimeout(() => this.bumping.set(false), 700);
  }
}
