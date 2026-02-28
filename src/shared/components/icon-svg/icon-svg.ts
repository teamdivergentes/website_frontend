import {Component, computed, input} from '@angular/core';
import {IconConfig, ProjectIconType} from '../../models/icon-types';

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
