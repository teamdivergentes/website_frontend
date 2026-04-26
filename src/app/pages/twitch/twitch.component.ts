import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-twitch',
  standalone: true,
  imports: [],
  templateUrl: './twitch.component.html',
  styleUrls: ['./twitch.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TwitchComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'En live',
      description: 'Suivez Team Divergentes en direct sur Twitch.',
      url: '/twitch'
    });
  }
}
