import { afterNextRender, Component, DestroyRef, inject } from '@angular/core';
import {RouterOutlet} from '@angular/router';
import {Header} from '../../headers/header/header';
import {Footer} from '../footer/footer';
import Lenis from 'lenis';

@Component({
  selector: 'app-main-layout',
  imports: [
    RouterOutlet,
    Header,
    Footer
  ],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss'
})
export class MainLayout {
  private readonly destroyRef = inject(DestroyRef);

  private lenis: Lenis | null = null;
  private rafId = 0;
  private snapTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    afterNextRender(() => {
      // Lenis desktop uniquement — sur mobile le scroll natif est plus fluide
      if (window.matchMedia('(max-width: 599px)').matches) return;
      this.initLenis();
    });
  }

  private initLenis(): void {
    this.lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    const raf = (time: number): void => {
      this.lenis?.raf(time);
      this.rafId = requestAnimationFrame(raf);
    };
    this.rafId = requestAnimationFrame(raf);

    this.initMagneticSnap();

    this.destroyRef.onDestroy(() => {
      if (this.snapTimer) clearTimeout(this.snapTimer);
      cancelAnimationFrame(this.rafId);
      this.lenis?.destroy();
      this.lenis = null;
    });
  }

  /**
   * Magnetic snap : quand l'utilisateur finit de scroller et qu'un titre [data-snap]
   * se trouve dans la zone magnétique (~120px de la position idéale sous le header),
   * Lenis corrige doucement le scroll pour aligner le titre.
   */
  private initMagneticSnap(): void {
    if (!this.lenis) return;

    let isSnapping = false;
    const MAGNETIC_ZONE = 120;
    const SNAP_DELAY = 100;

    this.lenis.on('scroll', (instance: Lenis) => {
      if (isSnapping) return;

      if (this.snapTimer) {
        clearTimeout(this.snapTimer);
        this.snapTimer = null;
      }

      if (Math.abs(instance.velocity) < 0.5) {
        this.snapTimer = setTimeout(() => {
          if (isSnapping || !this.lenis) return;

          const headerOffset = this.getHeaderOffset();
          const snapTargets = document.querySelectorAll<HTMLElement>('[data-snap]');
          let closestTarget: HTMLElement | null = null;
          let closestDistance = Infinity;

          snapTargets.forEach(target => {
            if (target.offsetParent === null) return;
            const distance = Math.abs(target.getBoundingClientRect().top - headerOffset);
            if (distance > 5 && distance < MAGNETIC_ZONE && distance < closestDistance) {
              closestDistance = distance;
              closestTarget = target;
            }
          });

          if (closestTarget) {
            isSnapping = true;
            this.lenis!.scrollTo(closestTarget, {
              offset: -headerOffset,
              duration: 0.8,
              onComplete: () => {
                setTimeout(() => { isSnapping = false; }, 200);
              },
            });
          }
        }, SNAP_DELAY);
      }
    });
  }

  private getHeaderOffset(): number {
    const pageContent = document.getElementById('page-content');
    if (pageContent) {
      return parseFloat(window.getComputedStyle(pageContent).paddingTop) + 20;
    }
    return (window.innerWidth < 600 ? 77 : 117) + 20;
  }
}
