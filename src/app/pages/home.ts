import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {MatAnchor, MatButton} from "@angular/material/button";
import {NgOptimizedImage} from "@angular/common";
import {ScreenSize, ScreenSizeService} from '../../shared/services/screen-size.service';
import {Router} from '@angular/router';
import {homepageVideoUrl, logoFilePath, socialLinks} from '../../shared/constants';
import {DomSanitizer} from '@angular/platform-browser';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SliderComponent} from '../../shared/components/slider/slider';
import {homeSliderImages} from '../data/slider-images';

@Component({
  selector: 'app-home',
  imports: [
    MatAnchor,
    MatButton,
    NgOptimizedImage,
    SliderComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  protected readonly router = inject(Router);
  protected readonly screenSizeService = inject(ScreenSizeService);
  protected readonly socialLinks = socialLinks;
  protected readonly domSanitizer = inject(DomSanitizer);

  /** Données du slider externalisées */
  protected readonly sliderImages = homeSliderImages;

  protected readonly logoFileUrl = logoFilePath;
  protected readonly sponsorsFileUrl = {
    xImg: 'assets/img/sponsors/x.png',
    pulsar: 'assets/img/sponsors/pulsar.svg'
  };
  protected readonly sponsorsLinks = {
    pulsar: 'https://www.behance.net/Pulsarcorp'
  };

  protected readonly repeatCount = Array.from({ length: 20 }, (_, i) => ({ id: i }));

  screenSize = signal<ScreenSize>('desktop');
  isMobile = computed(() => this.screenSize() === 'handset');

  protected readonly showMoreInformation = signal(false);

  protected readonly homepageVideoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(homepageVideoUrl);

  ngOnInit(): void {
    this.screenSizeService.screenSize$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(size => {
        this.screenSize.set(size);
      });
  }
}
