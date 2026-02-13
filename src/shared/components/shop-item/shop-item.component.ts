import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-shop-item',
  standalone: true,
  templateUrl: './shop-item.component.html',
  styleUrls: ['./shop-item.component.scss']
})
export class ShopItemComponent {
  @Input() visible = false;
  @Input() name = '';
  @Input() price = '';
  @Input() adress = '';
  @Input() frontImg: string | null = null;
  @Input() backImg: string | null = null;
  @Input() detailsHtml = '';

  @Output() closed = new EventEmitter<void>();

  currentMainImage: string | null = null;

  ngOnChanges(): void {
    // réinitialise l'image principale quand on ouvre un nouvel item
    this.currentMainImage = this.frontImg || this.backImg || null;
    // élève #page-content au-dessus du header quand le modal est visible
    document.body.classList.toggle('modal-open', this.visible);
  }

  close(): void {
    this.visible = false;
    this.currentMainImage = null;
    document.body.classList.remove('modal-open');
    this.closed.emit();
  }

  setMain(image: string | null): void {
    if (image) this.currentMainImage = image;
  }
}
