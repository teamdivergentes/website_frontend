import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-privacy-optout',
  standalone: true,
  templateUrl: './privacy-optout.html',
  styleUrl: './privacy-optout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrivacyOptoutComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Préférences vie privée',
      description: 'Gérez vos préférences de vie privée et optez pour ne pas être suivi par nos outils analytiques.',
      url: '/privacy-optout'
    });
  }
}
