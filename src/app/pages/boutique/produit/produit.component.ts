import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import {
  MATERIAL,
  MICROFIBRE_NOTICE,
  ORIGIN,
  SIZE_GUIDE,
  SORTING_NOTICE,
  TAX_LABEL,
  WEIGHT,
  asLabel,
  displayName,
  reference,
  CARE_INSTRUCTIONS,
  COMPOSITION_NOTES,
  shippingDelayNotice,
  splitTitle,
} from '../jersey-presentation';

/** Une vignette du rail de vues, sous le visuel principal. */
export interface ProductView {
  key: 'face' | 'dos';
  label: string;
  src: string;
  /** Vue de dos : c'est elle qui porte le flocage. */
  back: boolean;
}

/** Une autre déclinaison, proposée en bas du panneau d'achat. */
export interface OtherJersey {
  slug: string;
  name: string;
  accent: string;
  image: string | null;
}

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
  private readonly destroyRef = inject(DestroyRef);

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

  readonly material = MATERIAL;
  readonly weight = WEIGHT;
  readonly origin = ORIGIN;
  readonly taxLabel = TAX_LABEL;

  /**
   * Délai de livraison affiché avant l'achat (art. L216-1 C. conso). Calculé
   * une fois : il ne dépend d'aucun état du composant, seulement des
   * constantes légales de `SHOP_LEGAL`.
   */
  readonly shippingDelay = shippingDelayNotice();

  readonly microfibreNotice = MICROFIBRE_NOTICE;
  readonly compositionNotes = COMPOSITION_NOTES;
  readonly careInstructions = CARE_INSTRUCTIONS;

  /** Tarifs de livraison du catalogue : les memes que ceux appliques au panier. */
  readonly shippingStandardCents = this.shopService.shippingStandardCents;
  readonly shippingExpressCents = this.shopService.shippingExpressCents;
  readonly freeShippingThresholdCents = this.shopService.freeShippingThresholdCents;
  readonly sortingNotice = SORTING_NOTICE;

  readonly reference = computed(() => {
    const product = this.product();
    return product ? reference(product) : '';
  });

  readonly heading = computed(() => {
    const product = this.product();
    return product ? splitTitle(product.name) : { lead: '', accent: '' };
  });

  /** Le nom nettoyé, pour le fil d'Ariane et l'onglet du navigateur. */
  readonly displayName = computed(() => {
    const product = this.product();
    return product ? displayName(product) : '';
  });

  readonly eyebrow = computed(() => {
    const product = this.product();
    if (!product?.shortDescription) {
      return 'collection 2026';
    }
    return asLabel(product.shortDescription);
  });

  /**
   * Le rail n'affiche que les vues réellement livrées. Un maillot dont le
   * mockup de dos manque encore ne montre pas de vignette vide.
   */
  readonly views = computed<ProductView[]>(() => {
    const product = this.product();
    if (!product) {
      return [];
    }

    const views: ProductView[] = [];
    if (product.imageFront) {
      views.push({ key: 'face', label: 'face', src: product.imageFront, back: false });
    }
    if (product.imageBack) {
      views.push({ key: 'dos', label: 'dos', src: product.imageBack, back: true });
    }
    return views;
  });

  readonly currentImage = computed(() => {
    const product = this.product();
    if (!product) {
      return null;
    }
    return this.viewingBack() ? (product.imageBack ?? product.imageFront) : product.imageFront;
  });

  readonly currentViewLabel = computed(() => (this.viewingBack() ? 'dos' : 'face'));

  /** Les mesures ne sont affichées que pour les tailles réellement en vente. */
  readonly sizeGuide = computed(() => {
    const sizes = this.product()?.sizes ?? [];
    return SIZE_GUIDE.filter((row) => sizes.includes(row.size));
  });

  /** Les autres maillots de la collection, pour changer de déclinaison sans repasser par la liste. */
  readonly otherJerseys = computed<OtherJersey[]>(() => {
    const current = this.product();
    if (!current) {
      return [];
    }

    return this.shopService
      .products()
      .filter((candidate) => candidate.slug !== current.slug)
      .map((candidate) => ({
        slug: candidate.slug,
        name: candidate.name,
        accent: splitTitle(candidate.name).accent,
        image: candidate.imageCard ?? candidate.imageFront,
      }));
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

  /**
   * On suit `paramMap` et non `snapshot` : passer d'une déclinaison à l'autre
   * reste sur la même route, Angular réutilise donc le composant et `ngOnInit`
   * ne rejoue pas. Avec le snapshot, l'URL changeait sans que la fiche suive.
   */
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const slug = params.get('slug');
      if (!slug) {
        // Repli sur la liste : un echec de navigation ne doit pas laisser le
        // composant dans un etat incoherent, mais n'a rien a signaler non plus.
        this.router.navigate(['/boutique']).catch(() => undefined);
        return;
      }
      this.load(slug);
    });
  }

  selectSize(size: string): void {
    this.selectedSize.set(size);
  }

  selectView(view: ProductView): void {
    this.viewingBack.set(view.back);
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

  /**
   * Remet la fiche à zéro avant de charger une autre déclinaison : garder la
   * taille, la quantité ou le flocage du maillot précédent ferait acheter autre
   * chose que ce qui est affiché.
   */
  private resetSelection(): void {
    this.selectedSize.set(null);
    this.quantity.set(1);
    this.flockingEnabled.set(false);
    this.flockingText.set('');
    this.added.set(false);
    this.viewingBack.set(false);
  }

  private load(slug: string): void {
    this.resetSelection();
    this.error.set(undefined);
    this.loading.set(true);
    // Le catalogue alimente le panier (recalcul des montants) et la liste des
    // autres déclinaisons : il doit être chargé même quand on arrive
    // directement sur une fiche produit.
    this.shopService.loadCatalog().subscribe({ error: () => undefined });

    this.shopService.findBySlug(slug).subscribe({
      next: (product) => {
        this.product.set(product);
        this.selectedSize.set(product.sizes[0] ?? null);
        this.loading.set(false);
        this.seoService.updateMetaTags({
          title: displayName(product),
          description:
            product.shortDescription ??
            `${displayName(product)}, boutique officielle Team Divergentes.`,
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
