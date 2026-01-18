import {Component, signal} from '@angular/core';
import {UpperCasePipe} from "@angular/common";
import {RouterLink, RouterLinkActive} from '@angular/router';
import {mobileNavigationPages, navigationPages} from '../../navigation-pages';
import {LogoWithHover} from '../../components/logo-with-hover/logo-with-hover';
import {IconLink} from '../../components/icon-link/icon-link';
import {IconSvg, ProjectIconType} from '../../components/icon-svg/icon-svg';

@Component({
  selector: 'app-header',
  imports: [
    UpperCasePipe,
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

  showMobileMenu = signal(false);

  protected readonly navigationPages = navigationPages;
  protected readonly mobileNavigationPages = mobileNavigationPages;

  protected readonly IconType = ProjectIconType;
}
