import { Component, computed, signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { ShopItemComponent } from '../../../shared/components/shop-item/shop-item.component';
import { shoppingList, ShopItem } from '../../data/shopping-list';
import { DETAILS_SHOP_LIST } from '../../data/details-shopping-list';

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [ShopItemComponent, FontAwesomeModule],
  templateUrl: './shop.html',
  styleUrls: ['./shop.scss']
})
export class ShopComponent {
  // données
  shoppingList = shoppingList;

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

  get allNewItems(): ShopItem[] {
    const vip = this.vipNewItem;
    return vip ? [vip, ...this.newItems] : this.newItems;
  }

  openDetails(item: ShopItem): void {
    this.selectedItem.set(item);
    this.visible.set(true);
  }

  closeDetails(): void {
    this.visible.set(false);
    this.selectedItem.set(null);
  }

  onCardClick(event: Event, item: ShopItem): void {
    const target = event.target as HTMLElement;
    // Ne pas ouvrir les détails si on clique sur un lien ou un bouton
    if (target.tagName === 'A' || target.closest('a')) {
      return;
    }
    this.openDetails(item);
  }

}
