import { Component } from '@angular/core';
import {MatToolbar} from '@angular/material/toolbar';
import {NgOptimizedImage} from '@angular/common';
import {logoFilePath} from '../../constants';
import {ProjectIconType} from '../../components/icon-svg/icon-svg';
import {navigationPages} from '../../navigation-pages';
import {IconLink} from '../../components/icon-link/icon-link';
import {RouterLink} from '@angular/router';
import {MatDivider} from '@angular/material/divider';

@Component({
  selector: 'app-footer',
  imports: [
    IconLink,
    MatToolbar,
    NgOptimizedImage,
    RouterLink,
    MatDivider
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {

  protected readonly logoFileUrl = logoFilePath;
  protected readonly ProjectIconType = ProjectIconType;
  protected readonly navigationPages = navigationPages;

}
