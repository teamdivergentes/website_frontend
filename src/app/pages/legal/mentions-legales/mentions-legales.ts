import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
  selector: 'app-mentions-legales',
  standalone: true,
  templateUrl: './mentions-legales.html',
  styleUrl: './mentions-legales.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MentionsLegalesComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Mentions Légales',
      description: 'Mentions légales du site Team Divergentes - Éditeur, hébergeur, propriété intellectuelle.',
      url: '/mentions-legales'
    });
  }
}
