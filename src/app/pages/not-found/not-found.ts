import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly seoService = inject(SeoService);

  @ViewChild('glitchCanvas', { static: false })
  canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('svgContainer', { static: false })
  svgContainerRef!: ElementRef<HTMLDivElement>;

  private animationFrameId = 0;
  private prefersReducedMotion = false;

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Page non trouvée',
      description:
        "La page que vous recherchez n'existe pas ou a été déplacée.",
      url: '/404',
      noIndex: true,
    });

    this.prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
  }

  ngAfterViewInit(): void {
    this.initFuzzyEffect();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  goBack(): void {
    window.history.back();
  }

  private initFuzzyEffect(): void {
    const canvas = this.canvasRef?.nativeElement;
    const svgContainer = this.svgContainerRef?.nativeElement;
    if (!canvas || !svgContainer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const svgElement = svgContainer.querySelector('svg');
    if (!svgElement) return;

    const svgRect = svgElement.getBoundingClientRect();
    const svgWidth = svgRect.width || 800;
    const svgHeight = svgRect.height || 232;

    const horizontalMargin = 50;
    const verticalMargin = 30;
    canvas.width = svgWidth + horizontalMargin * 2;
    canvas.height = svgHeight + verticalMargin * 2;

    // Convert SVG to offscreen canvas ONCE (shake CSS animations are not
    // captured by XMLSerializer, so the image is static anyway)
    const offscreen = document.createElement('canvas');
    const offCtx = offscreen.getContext('2d');
    if (!offCtx) return;

    offscreen.width = svgWidth;
    offscreen.height = svgHeight;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgData);
    const img = new Image();

    img.onload = () => {
      offCtx.drawImage(img, 0, 0, svgWidth, svgHeight);

      if (this.prefersReducedMotion) {
        ctx.drawImage(offscreen, horizontalMargin, verticalMargin);
        return;
      }

      const baseIntensity = 0.4;
      const fuzzRange = 20;

      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(horizontalMargin, verticalMargin);

        for (let j = 0; j < svgHeight; j++) {
          const dx = Math.floor(
            baseIntensity * (Math.random() - 0.5) * fuzzRange
          );
          ctx.drawImage(offscreen, 0, j, svgWidth, 1, dx, j, svgWidth, 1);
        }

        ctx.restore();
        this.animationFrameId = requestAnimationFrame(animate);
      };

      animate();
    };

    img.onerror = () => {};
    img.src = url;
  }
}
