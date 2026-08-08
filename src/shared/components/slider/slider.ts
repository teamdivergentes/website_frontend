import {
  afterNextRender,
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
import { interval, Subscription } from 'rxjs';

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

  /** Signal de pause du défilement automatique */
  isPaused = signal(false);

  /** Souscription au défilement automatique */
  private autoPlaySubscription?: Subscription;

  /** Computed: nombre total de slides */
  totalSlides = computed(() => this.images().length);

  /**
   * Index des vues dont l'image a le droit d'etre telechargee.
   *
   * Les vues sont empilees au meme endroit : elles sont donc TOUTES dans le
   * viewport, et `loading="lazy"` ne differait rien. Le carrousel de l'accueil
   * telechargeait ses trois vues des le premier rendu, dont 134 Ko pour les deux
   * qui n'apparaissent qu'apres cinq et dix secondes — en concurrence directe
   * avec le JavaScript qui, lui, conditionne l'affichage.
   *
   * On ne demande donc que la vue affichee, plus une d'avance pour que la
   * rotation ne montre jamais de trou. La vue suivante est ajoutee dans
   * `afterNextRender`, c'est-a-dire APRES la premiere peinture : le
   * comportement visible est inchange, seul l'ordre de chargement l'est.
   */
  private readonly requested = signal<ReadonlySet<number>>(new Set([0]));

  constructor() {
    afterNextRender(() => this.request(this.currentIndex() + 1));
  }

  /** Une vue doit-elle porter sa source ? */
  isRequested(index: number): boolean {
    return this.requested().has(index);
  }

  /** Autorise le telechargement d'une vue, en repliant l'index sur la boucle. */
  private request(index: number): void {
    const total = this.totalSlides();
    if (total === 0) return;
    const normalized = ((index % total) + total) % total;
    if (this.requested().has(normalized)) return;
    this.requested.update(set => new Set(set).add(normalized));
  }

  ngOnInit(): void {
    this.startAutoPlay();
  }

  private startAutoPlay(): void {
    const intervalMs = this.autoPlayInterval();
    if (intervalMs > 0) {
      this.autoPlaySubscription = interval(intervalMs)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          if (!this.isPaused()) {
            this.nextSlide();
          }
        });
    }
  }

  togglePause(): void {
    this.isPaused.update(v => !v);
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
      // Une vue d'avance : la suivante est prete avant qu'on y arrive.
      this.request(index);
      this.request(index + 1);
      this.slideChange.emit(index);
    }
  }
}
