import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  FLOCKING_MAX_LENGTH,
  FLOCKING_PATTERN,
  ShopProduct,
} from '../../../shared/models/shop-product.model';
import { ShopService } from '../../../shared/services/shop.service';
import { CartService } from '../../../shared/services/cart.service';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
  selector: 'app-boutique-produit',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink],
  templateUrl: './produit.component.html',
  styleUrls: ['./produit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProduitComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly shopService = inject(ShopService);
  private readonly cartService = inject(CartService);
  private readonly seoService = inject(SeoService);

  readonly product = signal<ShopProduct | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | undefined>(undefined);

  readonly selectedSize = signal<string | null>(null);
  readonly quantity = signal(1);
  readonly flockingEnabled = signal(false);
  readonly flockingText = signal('');
  readonly added = signal(false);

  /** Face affichée dans la galerie. Le flocage bascule d'office sur le dos. */
  readonly viewingBack = signal(false);

  readonly maxFlockingLength = FLOCKING_MAX_LENGTH;

  readonly currentImage = computed(() => {
    const product = this.product();
    if (!product) {
      return null;
    }
    return this.viewingBack() ? (product.imageBack ?? product.imageFront) : product.imageFront;
  });

  /**
   * Le flocage n'est retenu que s'il est non vide : « ne rien mettre » est un
   * choix valide, et il ne doit pas facturer le surcoût.
   */
  readonly effectiveFlocking = computed(() => {
    if (!this.flockingEnabled()) {
      return null;
    }
    const value = this.flockingText().trim().replace(/\s+/g, ' ');
    return value.length > 0 ? value : null;
  });

  /**
   * La longueur est mesurée sur la valeur **normalisée**, comme le fait le
   * serveur : sinon un pseudo suivi d'un espace serait refusé ici alors que
   * l'API l'accepte, et l'utilisateur ne comprendrait pas le refus.
   */
  readonly flockingError = computed(() => {
    const raw = this.flockingText();
    const normalized = raw.trim().replace(/\s+/g, ' ');

    if (normalized.length > FLOCKING_MAX_LENGTH) {
      return `${FLOCKING_MAX_LENGTH} caractères maximum.`;
    }
    if (!FLOCKING_PATTERN.test(normalized)) {
      return 'Lettres, chiffres, espaces, points, tirets et underscores uniquement.';
    }
    return undefined;
  });

  readonly unitPriceCents = computed(() => {
    const product = this.product();
    if (!product) {
      return 0;
    }
    return product.priceCents + (this.effectiveFlocking() ? product.flockingFeeCents : 0);
  });

  readonly totalCents = computed(() => this.unitPriceCents() * this.quantity());

  readonly canAdd = computed(
    () => this.product() !== null && this.selectedSize() !== null && !this.flockingError(),
  );

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      void this.router.navigate(['/boutique']);
      return;
    }
    this.load(slug);
  }

  selectSize(size: string): void {
    this.selectedSize.set(size);
  }

  toggleFlocking(enabled: boolean): void {
    this.flockingEnabled.set(enabled);
    // Montrer le dos quand on active le flocage : c'est là qu'il apparaît.
    if (enabled && this.product()?.imageBack) {
      this.viewingBack.set(true);
    }
  }

  changeQuantity(delta: number): void {
    this.quantity.update((current) => Math.min(10, Math.max(1, current + delta)));
  }

  addToCart(): void {
    const product = this.product();
    const size = this.selectedSize();
    if (!product || !size || this.flockingError()) {
      return;
    }

    this.cartService.add({
      productId: product.id,
      size,
      quantity: this.quantity(),
      flockingText: this.effectiveFlocking(),
    });

    this.added.set(true);
  }

  private load(slug: string): void {
    this.loading.set(true);
    // Le catalogue alimente le panier (recalcul des montants) : il doit être
    // chargé même quand on arrive directement sur une fiche produit.
    this.shopService.loadCatalog().subscribe({ error: () => undefined });

    this.shopService.findBySlug(slug).subscribe({
      next: (product) => {
        this.product.set(product);
        this.selectedSize.set(product.sizes[0] ?? null);
        this.loading.set(false);
        this.seoService.updateMetaTags({
          title: product.name,
          description:
            product.shortDescription ??
            `${product.name} — boutique officielle Team Divergentes.`,
          url: `/boutique/${product.slug}`,
        });
      },
      error: () => {
        this.loading.set(false);
        this.error.set("Ce produit n'est plus disponible.");
      },
    });
  }
}
