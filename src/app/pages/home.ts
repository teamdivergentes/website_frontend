import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {MatAnchor, MatButton} from "@angular/material/button";
import {NgClass, NgOptimizedImage} from "@angular/common";
import {ScreenSize, ScreenSizeService} from '../../shared/services/screen-size.service';
import {Router} from '@angular/router';
import {homepageVideoUrl, logoFilePath, socialLinks} from '../../shared/constants';

@Component({
  selector: 'app-home',
  imports: [
    MatAnchor,
    NgOptimizedImage,
    MatButton,
    NgOptimizedImage,
    NgClass,
    NgOptimizedImage,
    MatButton,
    NgOptimizedImage
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit {

  protected readonly router = inject(Router);
  protected readonly screenSizeService = inject(ScreenSizeService);
  protected readonly socialLinks = socialLinks;

  protected readonly sliderImages: {index: number, path: string, width: number, height: number, alt: string}[] = [{
    path: 'assets/img/home/slider-1.png',
    width: 2880,
    height: 727,
    alt: 'Première slide image',
    index: 0
  }, {
    path: 'assets/img/home/slider-2.jpg',
    width: 1725,
    height: 465,
    alt: 'Seconde slide image',
    index: 1
  }, {
    path: 'assets/img/home/slider-3.png',
    width: 2697,
    height: 699,
    alt: 'Troisième slide image',
    index: 2
  }];

  private intervalId = setInterval(() => {
    const nextIndex = (this.currentSliderIndex() + 1) % this.sliderImages.length;
    this.currentSliderIndex.set(nextIndex);
  }, 5000);


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

  currentSliderIndex = signal(0);
  protected readonly showMoreInformation = signal(false);

  protected readonly homepageVideoUrl = homepageVideoUrl;

  nextSlide() {
    this.currentSliderIndex.update(index => (index + 1) % this.sliderImages.length);
  }

  previousSlide() {
    this.currentSliderIndex.update(index => (index - 1 + this.sliderImages.length) % this.sliderImages.length);
  }

  ngOnInit(): void {
    this.screenSizeService.screenSize$.subscribe(size => {
      console.info('Screen size changed:', size);
      this.screenSize.set(size);
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

}
