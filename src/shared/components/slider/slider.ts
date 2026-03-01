import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal
} from '@angular/core';
import { NgClass } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

export interface SliderImage {
  index: number;
  path: string;
  /** Chemin WebP optionnel pour le format moderne (utilise dans <picture> comme source prioritaire) */
  webpPath?: string;
  width: number;
  height: number;
  alt: string;
}

@Component({
  selector: 'app-slider',
  standalone: true,
  imports: [NgClass],
  templateUrl: './slider.html',
  styleUrl: './slider.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SliderComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  /** Input: Liste des images à afficher */
  images = input.required<SliderImage[]>();

  /** Input: Intervalle en ms pour l'auto-rotation (0 = désactivé) */
  autoPlayInterval = input<number>(5000);

  /** Input: Afficher les flèches de navigation */
  showArrows = input<boolean>(true);

  /** Input: Afficher les points de navigation */
  showDots = input<boolean>(true);

  /** Output: Émet l'index courant à chaque changement */
  slideChange = output<number>();

  /** État interne */
  currentIndex = signal(0);

  /** Computed: nombre total de slides */
  totalSlides = computed(() => this.images().length);

  ngOnInit(): void {
    const intervalMs = this.autoPlayInterval();
    if (intervalMs > 0) {
      interval(intervalMs)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.nextSlide());
    }
  }

  nextSlide(): void {
    const nextIndex = (this.currentIndex() + 1) % this.totalSlides();
    this.goToSlide(nextIndex);
  }

  previousSlide(): void {
    const prevIndex = (this.currentIndex() - 1 + this.totalSlides()) % this.totalSlides();
    this.goToSlide(prevIndex);
  }

  goToSlide(index: number): void {
    if (index >= 0 && index < this.totalSlides()) {
      this.currentIndex.set(index);
      this.slideChange.emit(index);
    }
  }
}
