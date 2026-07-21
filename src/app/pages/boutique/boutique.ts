import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { ShopItemComponent } from '../../../shared/components/shop-item/shop-item.component';
import { DETAILS_SHOP_LIST } from '../../data/details-shopping-list';
import { ShopProduct } from '../../shared/models/shop-product.model';
import { ShopService } from '../../shared/services/shop.service';
import { SeoService } from '../../shared/services/seo.service';
import { BuyDialogComponent } from './buy-dialog.component';

// Mise en page : ces identifiants pilotent l'affichage (nouveauté / mise en avant),
// pas le catalogue serveur qui ne porte pas cette notion.
const NEW_COLLECTION_IDS = new Set([
  'tShirtMenpo_2023',
  'tShirtYinYang_2023',
  'tShirtKanji_2023',
  'hoodieYinYang_2023',
  'hoodieSnake_2023',
  'hoodieMenpo_2023',
]);
const VIP_PRODUCT_ID = 'maillotDvg_2023';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [ShopItemComponent, FontAwesomeModule, DecimalPipe],
  templateUrl: './boutique.html',
  styleUrls: ['./boutique.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoutiqueComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly shopService = inject(ShopService);
  private readonly dialog = inject(MatDialog);

  faEye = faEye;
  faCartShopping = faCartShopping;

  // données : catalogue chargé depuis l'API
  readonly products = this.shopService.products;
  readonly loading = signal(false);
  readonly error = signal<string | undefined>(undefined);

  // état pour l’accordéon "active" sur les cartes (comme l’ancienne flèche)
  expanded = signal<Record<string, boolean>>({});

  // état du modal
  visible = signal(false);
  selectedItem = signal<ShopProduct | null>(null);

  // détail HTML résolu depuis la clé — reste côté client : le faire transiter
  // par l'API transformerait le [innerHTML] de shop-item en vecteur XSS.
  detailsHtml = computed(() => {
    const it = this.selectedItem();
    if (!it) return '';
    return DETAILS_SHOP_LIST[it.descKey] || '';
  });

  // Mise en avant (bannière "shop-featured") : le maillot vedette de la collection.
  readonly vipNewItem = computed(
    () => this.products().find((p) => p.id === VIP_PRODUCT_ID) ?? null,
  );
  // Nouveautés hors mise en avant
  readonly newItems = computed(() =>
    this.products().filter((p) => NEW_COLLECTION_IDS.has(p.id)),
  );
  // Ancienne collection (tout ce qui n'est pas marqué "nouveauté")
  readonly oldItems = computed(() =>
    this.products().filter((p) => !NEW_COLLECTION_IDS.has(p.id)),
  );

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Boutique',
      description: 'Boutique officielle Team Divergentes : maillots, hoodies, t-shirts et accessoires esport. Textile certifié Oeko-Tex, personnalisé en France.',
      url: '/boutique'
    });
    this.loadProducts();
  }

  toggleCard(id: string): void {
    const cur = this.expanded();
    this.expanded.set({ ...cur, [id]: !cur[id] });
  }

  openDetails(item: ShopProduct): void {
    this.selectedItem.set(item);
    this.visible.set(true);
  }

  closeDetails(): void {
    this.visible.set(false);
    this.selectedItem.set(null);
  }

  openBuyDialog(product: ShopProduct): void {
    this.dialog.open(BuyDialogComponent, {
      width: '460px',
      maxWidth: '95vw',
      data: { product },
    });
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.error.set(undefined);
    this.shopService.loadProducts().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set('La boutique est momentanément indisponible.');
      },
    });
  }

  baseSponsorsLeft = [
    {
      url: "https://www.behance.net/Pulsarcorp",
      img: "assets/img/sponsors/pulsar.svg",
      alt: "logo sponsor Pulsar"
    },
    {
      separator: true
    },
    {
      url: "https://eliminate.fr/",
      img: "assets/img/sponsors/LMN8.svg",
      alt: "logo sponsor LMN8"
    },
    {
      separator: true
    }
  ];

  repeatItems(times: number) {
    return Array(times).fill(this.baseSponsorsLeft).flat();
  }

  sponsorItemsLeft = this.repeatItems(10);

  repeatSponsorItems(times: number) {
    const base = [
      { text: "nouvelle collection", img: "assets/logos/logoTD.svg" },
    ];
    return Array(times).fill(base).flat();
  }

  sponsorItems = this.repeatSponsorItems(10);
}
