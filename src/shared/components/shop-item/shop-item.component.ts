import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  ViewChild,
  DOCUMENT,
  effect,
  inject,
  signal,
} from '@angular/core';

@Component({
  selector: 'app-shop-item',
  standalone: true,
  templateUrl: './shop-item.component.html',
  styleUrls: ['./shop-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopItemComponent implements OnChanges {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly hostRef = inject(ElementRef);

  /** Parent qui crée un stacking context (z-index != auto) */
  private stackingParent: HTMLElement | null = null;
  private originalZIndex = '';

  @Input() visible = false;
  @Input() name = '';
  @Input() price = '';
  @Input() adress = '';
  @Input() frontImg: string | null = null;
  @Input() backImg: string | null = null;
  @Input() detailsHtml = '';

  @Output() closed = new EventEmitter<void>();

  @ViewChild('closeBtn') closeBtnRef!: ElementRef<HTMLButtonElement>;

  currentMainImage = signal<string | null>(null);
  isVisible = signal(false);

  constructor() {
    // Scroll lock + z-index boost pour échapper au stacking context parent
    effect(() => {
      if (this.isVisible()) {
        this.document.body.style.overflow = 'hidden';
        this.boostParentZIndex();
      } else {
        this.document.body.style.overflow = '';
        this.restoreParentZIndex();
      }
    });

    // Restaurer le scroll et le z-index si le composant est détruit
    this.destroyRef.onDestroy(() => {
      this.document.body.style.overflow = '';
      this.restoreParentZIndex();
    });
  }

  /** Trouve le parent créant un stacking context et booste son z-index au-dessus du header */
  private boostParentZIndex(): void {
    let parent = this.hostRef.nativeElement.parentElement;
    while (parent && parent !== this.document.body) {
      const style = getComputedStyle(parent);
      if (style.zIndex !== 'auto' && style.position !== 'static') {
        this.stackingParent = parent;
        this.originalZIndex = parent.style.zIndex;
        parent.style.zIndex = '10001';
        return;
      }
      parent = parent.parentElement;
    }
  }

  /** Restaure le z-index original du parent */
  private restoreParentZIndex(): void {
    if (this.stackingParent) {
      this.stackingParent.style.zIndex = this.originalZIndex;
      this.stackingParent = null;
      this.originalZIndex = '';
    }
  }

  ngOnChanges(): void {
    this.isVisible.set(this.visible);
    if (this.visible) {
      this.currentMainImage.set(this.frontImg || this.backImg || null);
      // Focus le bouton de fermeture à l'ouverture
      queueMicrotask(() => this.closeBtnRef?.nativeElement?.focus());
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.isVisible()) {
      this.close();
    }
  }

  close(): void {
    this.isVisible.set(false);
    this.currentMainImage.set(null);
    this.closed.emit();
  }

  setMain(image: string | null): void {
    if (image) this.currentMainImage.set(image);
  }

  isActiveImage(image: string | null): boolean {
    return image != null && this.currentMainImage() === image;
  }
}
