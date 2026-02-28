import {Component, computed, input} from '@angular/core';
import {IconSvg} from '../icon-svg/icon-svg';
import {socialLinks} from '../../constants';
import {IconConfig} from '../../models/icon-types';

@Component({
  selector: 'app-icon-link',
  imports: [
    IconSvg
  ],
  templateUrl: './icon-link.html'
})
export class IconLink {

  iconConfig = input.required<IconConfig>();

  readonly resolvedIconLink = computed(() => {
    return socialLinks[this.iconConfig().iconType] ?? this.iconConfig().iconLink ?? null
  });

}
