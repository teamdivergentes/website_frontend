// Version A de la boutique — copie conforme de `develop` (page unique, grille + modal),
// servie sur /boutique le temps de la comparaison avec la refonte servie sur /boutique2.
// Ce dossier est volontairement isolé : il ne doit pas diverger de develop.
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faEye, faCartShopping } from '@fortawesome/free-solid-svg-icons';
import { ShopItemComponent } from '../../../shared/components/shop-item/shop-item.component';
import { shoppingList, ShopItem } from '../../data/shopping-list';
import { DETAILS_SHOP_LIST } from '../../data/details-shopping-list';
import { SeoService } from '../../shared/services/seo.service';


@Component({
  selector: 'app-shop-v1',
  standalone: true,
  imports: [ShopItemComponent, FontAwesomeModule],
  templateUrl: './boutique-v1.html',
  styleUrls: ['./boutique-v1.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BoutiqueV1Component implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Boutique',
      description: 'Boutique officielle Team Divergentes : maillots, hoodies, t-shirts et accessoires esport. Textile certifié Oeko-Tex, personnalisé en France.',
      url: '/boutique'
    });
  }

  faEye = faEye;
  faCartShopping = faCartShopping;

  // données
  shoppingList = shoppingList;

  // état pour l’accordéon "active" sur les cartes (comme l’ancienne flèche)
  expanded = signal<Record<string, boolean>>({});

  // état du modal
  visible = signal(false);
  selectedItem = signal<ShopItem | null>(null);

  // détail HTML résolu depuis la clé
  detailsHtml = computed(() => {
    const it = this.selectedItem();
    if (!it) return '';
    return DETAILS_SHOP_LIST[it.descKey] || '';
  });

  // helpers de filtre (VIP / new / old)
  get vipNewItem(): ShopItem | null {
    return this.shoppingList.find(i => i.new && i.vip) ?? null;
  }
  get newItems(): ShopItem[] {
    return this.shoppingList.filter(i => i.new && !i.vip);
  }
  get oldItems(): ShopItem[] {
    return this.shoppingList.filter(i => !i.new);
  }

  toggleCard(id: string): void {
    const cur = this.expanded();
    this.expanded.set({ ...cur, [id]: !cur[id] });
  }

  openDetails(item: ShopItem): void {
    this.selectedItem.set(item);
    this.visible.set(true);
  }

  closeDetails(): void {
    this.visible.set(false);
    this.selectedItem.set(null);
  }

  trackById(_: number, item: ShopItem) {
    return item.id;
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
    return new Array(times).fill(this.baseSponsorsLeft).flat();
  }

  sponsorItemsLeft = this.repeatItems(10);

  repeatSponsorItems(times: number) {
    const base = [
      { text: "nouvelle collection", img: "assets/logos/logoTD.svg" },
    ];
    return new Array(times).fill(base).flat();
  }

  sponsorItems = this.repeatSponsorItems(10);
}
