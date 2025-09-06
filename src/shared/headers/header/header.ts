import {Component, ElementRef, HostListener, inject, signal, ViewChild} from '@angular/core';
import {MatToolbar} from "@angular/material/toolbar";
import {NgOptimizedImage, UpperCasePipe} from "@angular/common";
import {Router, RouterLink, RouterLinkActive} from '@angular/router';
import {mobileNavigationPages, navigationPages} from '../../navigation-pages';
import {LogoWithHover} from '../../components/logo-with-hover/logo-with-hover';
import {IconLink} from '../../components/icon-link/icon-link';
import {IconSvg} from '../../components/icon-svg/icon-svg';

interface StructureHeaderImg {
  id: number;
  link: string;
  alt: string;
  width: number;
  height: number;
}

export enum ProjectIconType {
  YOUTUBE = 'youtube',
  TWITCH = 'twitch',
  MENU = 'menu',
  INSTAGRAM = 'instagram',
  TWITTER = 'twitter',
  DISCORD = 'discord',
  MAIL = 'mail'
}

@Component({
  selector: 'app-header',
  imports: [
    MatToolbar,
    NgOptimizedImage,
    UpperCasePipe,
    MatToolbar,
    RouterLink,
    RouterLinkActive,
    LogoWithHover,
    IconLink,
    IconSvg
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss'
})
export class Header {

  /** Dependencies */
  router = inject(Router);

  showStructureBlock = signal(false);
  showMobileMenu = signal(false);

  @ViewChild('structureBlock') structureBlockRef!: ElementRef;

  protected readonly navigationPages = navigationPages;
  protected readonly mobileNavigationPages = mobileNavigationPages;

  protected readonly IconType = ProjectIconType;

  structureImgs: StructureHeaderImg[] = [
    {
      id: 0,
      link: 'assets/img/header/structure.png',
      alt: "la structure",
      width: 3058,
      height: 2335
    },
    {
      id: 1,
      link: 'assets/img/header/palmares.png',
      alt: "palmarès",
      width: 3058,
      height: 2335
    },
    {
      id: 2,
      link: 'assets/img/header/ambassadeur.png',
      alt: "équipes /<br> ambassadeurs",
      width: 3058,
      height: 2335
    },
    {
      id: 3,
      link: 'assets/img/header/sponsors.png',
      alt: "nos sponsors",
      width: 3060,
      height: 2335
    },
    {
      id: 4,
      link: 'assets/img/header/recrutement.png',
      alt: "recrutement",
      width: 3057,
      height: 2335
    }
  ];

  // // Ferme au clic à l'extérieur
  // @HostListener('document:click', ['$event'])
  // onDocumentClick(event: MouseEvent) {
  //   const clickedInside = this.structureBlockRef?.nativeElement.contains(event.target);
  //   if (!clickedInside) {
  //     this.showStructureBlock.set(false);
  //   }
  // }
  //
  // // Ferme à l'appui sur Échap
  // @HostListener('document:keydown.escape', ['$event'])
  // onEscapeKey(event: Event) {
  //   this.showStructureBlock.set(false);
  // }

}
