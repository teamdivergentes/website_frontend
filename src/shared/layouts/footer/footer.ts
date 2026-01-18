import { Component } from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {logoFilePath} from '../../constants';
import {ProjectIconType} from '../../components/icon-svg/icon-svg';
import {IconLink} from '../../components/icon-link/icon-link';

@Component({
  selector: 'app-footer',
  imports: [
    IconLink,
    NgOptimizedImage
  ],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {

  protected readonly logoFileUrl = logoFilePath;
  protected readonly ProjectIconType = ProjectIconType;

}
