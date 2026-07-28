import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../shared/services/shop.service';
import { CartService } from '../../shared/services/cart.service';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './boutique.html',
  styleUrls: ['./boutique.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoutiqueComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly shopService = inject(ShopService);
  private readonly cartService = inject(CartService);

  readonly products = this.shopService.products;
  readonly shopEnabled = this.shopService.shopEnabled;
  readonly cartCount = this.cartService.itemCount;
  readonly loading = signal(true);
  readonly error = signal<string | undefined>(undefined);

  /**
   * Produit mis en avant dans la banniere : le premier du catalogue, l'ordre
   * etant pilote depuis l'admin par le champ `position`.
   */
  readonly featured = computed(() => this.products()[0] ?? null);

  /** Les autres produits, presentes en grille sous la mise en avant. */
  readonly gridProducts = computed(() => this.products().slice(1));

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Boutique',
      description:
        'Boutique officielle Team Divergentes : maillots de la collection 2026, personnalisables au flocage. Maille 100 % polyester européen, fabriqué en Europe.',
      url: '/boutique',
    });
    this.loadCatalog();
  }

  private loadCatalog(): void {
    this.loading.set(true);
    this.error.set(undefined);
    this.shopService.loadCatalog().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set('La boutique est momentanément indisponible.');
      },
    });
  }

  baseSponsorsLeft = [
    {
      url: 'https://www.behance.net/Pulsarcorp',
      img: 'assets/img/sponsors/pulsar.svg',
      alt: 'logo sponsor Pulsar',
    },
    {
      separator: true,
    },
    {
      url: 'https://eliminate.fr/',
      img: 'assets/img/sponsors/LMN8.svg',
      alt: 'logo sponsor LMN8',
    },
    {
      separator: true,
    },
  ];

  repeatItems(times: number) {
    return Array(times).fill(this.baseSponsorsLeft).flat();
  }

  sponsorItemsLeft = this.repeatItems(10);

  repeatSponsorItems(times: number) {
    const base = [{ text: 'nouvelle collection', img: 'assets/logos/logoTD.svg' }];
    return Array(times).fill(base).flat();
  }

  sponsorItems = this.repeatSponsorItems(10);
}
