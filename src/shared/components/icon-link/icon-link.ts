import {Component, computed, input} from '@angular/core';
import {IconSvg, ProjectIconType} from '../icon-svg/icon-svg';
import {socialLinks} from '../../constants';

export interface IconConfig {
  iconType: ProjectIconType;
  iconLink?: string | null;
  width?: number;
  height?: number;
  color?: string;
}

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

  readonly ariaLabel = computed(() => {
    const labels: Record<string, string> = {
      'instagram': 'Visitez notre Instagram',
      'twitter': 'Visitez notre X (Twitter)',
      'youtube': 'Visitez notre chaîne YouTube',
      'discord': 'Rejoignez notre Discord',
      'twitch': 'Suivez-nous sur Twitch',
      'mail': 'Envoyez-nous un email'
    };
    return labels[this.iconConfig().iconType] ?? `Lien ${this.iconConfig().iconType}`;
  });

}
