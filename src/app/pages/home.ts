import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {MatAnchor, MatButton} from "@angular/material/button";
import {NgOptimizedImage} from "@angular/common";
import {ScreenSize, ScreenSizeService} from '../../shared/services/screen-size.service';
import {Router, RouterLink} from '@angular/router';
import {homepageVideoId, homepageVideoUrl, logoFilePath, socialLinks} from '../../shared/constants';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SliderComponent} from '../../shared/components/slider/slider';
import {homeSliderImages} from '../data/slider-images';
import {SeoService} from '../shared/services/seo.service';
import {ConfigService} from '../shared/services/config.service';

@Component({
  selector: 'app-home',
  imports: [
    MatAnchor,
    MatButton,
    NgOptimizedImage,
    RouterLink,
    SliderComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly seoService = inject(SeoService);
  private readonly configService = inject(ConfigService);
  protected readonly router = inject(Router);
  protected readonly screenSizeService = inject(ScreenSizeService);
  protected readonly socialLinks = socialLinks;
  protected readonly domSanitizer = inject(DomSanitizer);

  /** Donnees du slider externalisees */
  protected readonly sliderImages = homeSliderImages;

  protected readonly logoFileUrl = logoFilePath;
  protected readonly sponsorsFileUrl = {
    pulsar: 'assets/img/sponsors/pulsar.svg'
  };
  protected readonly sponsorsLinks = {
    pulsar: 'https://www.behance.net/Pulsarcorp'
  };

  /** 2 copies du set de logos suffisent pour l'animation CSS translateX infinie */
  protected readonly sponsorsCopies = [0, 1];

  screenSize = signal<ScreenSize>('desktop');
  isMobile = computed(() => this.screenSize() === 'handset');

  protected readonly showMoreInformation = signal(false);

  /** YouTube facade : on ne charge l'iframe qu'apres le clic de l'utilisateur */
  protected readonly videoPlaying = signal(false);

  /** Thumbnail YouTube via l'API d'images publique de YouTube */
  protected readonly youtubeThumbnailUrl = `https://img.youtube.com/vi/${homepageVideoId}/maxresdefault.jpg`;

  /** URL sanitisee de la video YouTube (chargee uniquement apres le clic) */
  protected readonly homepageVideoUrl: SafeResourceUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(homepageVideoUrl);

  protected playVideo(): void {
    this.videoPlaying.set(true);
  }

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Accueil',
      description: 'Team Divergentes - Structure esportive française fondée en 2017. Équipes compétitives, événements et communauté gaming.',
      url: '/'
    });
    this.seoService.setJsonLd([
      this.seoService.getOrganizationJsonLd(this.configService.socialUrls()),
      this.seoService.getWebSiteJsonLd(),
    ]);

    this.screenSizeService.screenSize$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(size => {
        this.screenSize.set(size);
      });
  }
}
