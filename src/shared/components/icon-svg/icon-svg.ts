import {Component, computed, input} from '@angular/core';
import {IconConfig} from '../icon-link/icon-link';

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
  selector: 'app-icon-svg',
  imports: [],
  templateUrl: './icon-svg.html'
})
export class IconSvg {

  iconConfig = input.required<IconConfig>();

  protected readonly iconType = computed(() => {
    return this.iconConfig().iconType
  });

  protected readonly iconHeight = computed(() => {
    return this.iconConfig().height ?? 24
  });

  protected readonly iconWidth = computed(() => {
    return this.iconConfig().width ?? 24
  });

  protected readonly iconColor = computed(() => {
    return this.iconConfig().color ?? "#FFFFFF"
  });

  protected readonly IconType = ProjectIconType;
}
