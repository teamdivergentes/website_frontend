import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../../shared/services/seo.service';
import { PageHeaderComponent } from '../../../shared/components/layout/page-header.component';

@Component({
  selector: 'app-politique-confidentialite',
  standalone: true,
  imports: [PageHeaderComponent],
  templateUrl: './politique-confidentialite.html',
  styleUrl: './politique-confidentialite.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PolitiqueConfidentialiteComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Politique de Confidentialité',
      description: 'Politique de confidentialité et de protection des données personnelles de Team Divergentes conformément au RGPD.',
      url: '/politique-de-confidentialite'
    });
  }
}
