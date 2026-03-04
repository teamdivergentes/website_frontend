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

  constructor() {
    afterNextRender(() => this.initLenis());
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

    this.destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.rafId);
      this.lenis?.destroy();
      this.lenis = null;
    });
  }
}
