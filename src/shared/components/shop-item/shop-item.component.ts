import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  Renderer2,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-shop-item',
  standalone: true,
  templateUrl: './shop-item.component.html',
  styleUrls: ['./shop-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopItemComponent implements OnDestroy {
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);

  // --- Signal inputs (BETA-001, BETA-002) ---
  visible = input(false);
  name = input('');
  price = input('');
  frontImg = input<string | null>(null);
  backImg = input<string | null>(null);
  detailsHtml = input('');

  // --- Outputs (BETA-002) ---
  closed = output<void>();
  buyRequested = output<void>();

  // --- Etat local : image selectionnee manuellement (BETA-006) ---
  private readonly selectedImage = signal<string | null>(null);

  // --- Image principale : computed derive des inputs et de la selection (BETA-004) ---
  currentMainImage = computed<string | null>(() => {
    // Quand visible passe a false ou que le produit change, on ignore selectedImage
    if (!this.visible()) return null;
    return this.selectedImage() ?? this.frontImg() ?? this.backImg() ?? null;
  });

  // --- Ref du conteneur modal pour le focus trap (BETA-005) ---
  @ViewChild('modalContainer') modalContainerRef!: ElementRef<HTMLElement>;

  // --- Effect : scroll lock + reset + focus trap (BETA-003, BETA-004, BETA-005) ---
  private readonly scrollLockEffect = effect(() => {
    const isVisible = this.visible();

    if (isVisible) {
      // Reinitialise la selection quand un nouvel item s'ouvre
      this.selectedImage.set(null);
      this.renderer.setStyle(this.document.body, 'overflow', 'hidden');

      // Focus trap : focus le premier element interactif du modal
      // On differe au prochain cycle pour laisser le DOM se mettre a jour
      Promise.resolve().then(() => {
        const container = this.modalContainerRef?.nativeElement;
        if (!container) return;
        const focusable = container.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      });
    } else {
      this.renderer.setStyle(this.document.body, 'overflow', '');
    }
  });

  // --- Fermeture avec Escape (UX-004, BETA-005) ---
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.visible()) {
      this.close();
    }
  }

  // --- Fermeture : NE mute PAS l'input, emet seulement l'evenement (BETA-005) ---
  close(): void {
    this.selectedImage.set(null);
    this.closed.emit();
  }

  // --- Selection manuelle d'une image par vignette (BETA-006) ---
  setMain(image: string | null): void {
    if (image) {
      this.selectedImage.set(image);
    }
  }

  // --- Etat actif d'une vignette (utilise par le nouveau template) ---
  isActiveImage(image: string | null): boolean {
    return image != null && this.currentMainImage() === image;
  }

  // --- Cleanup securise au destroy (SEC-004) ---
  ngOnDestroy(): void {
    this.renderer.setStyle(this.document.body, 'overflow', '');
  }
}
