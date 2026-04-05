import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {IconSvg} from '../icon-svg/icon-svg';
import {IconConfig} from '../../models/icon-types';
import {ConfigService} from '../../../app/shared/services/config.service';

@Component({
  selector: 'app-icon-link',
  imports: [
    IconSvg
  ],
  templateUrl: './icon-link.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconLink {
  private readonly configService = inject(ConfigService);

  iconConfig = input.required<IconConfig>();

  readonly resolvedIconLink = computed(() => {
    const type = this.iconConfig().iconType;
    const fromConfig = this.configService.socialLinksMap()[type];
    return fromConfig || this.iconConfig().iconLink || null;
  });
}
