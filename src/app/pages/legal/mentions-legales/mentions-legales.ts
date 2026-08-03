import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { PageHeaderComponent } from '../../../shared/components/layout/page-header.component';
import { PageComponent } from '../../../shared/components/layout/page.component';
import { HOST, LEGAL, SHOP_LEGAL, orMissing } from '../legal-info';

@Component({
  selector: 'app-mentions-legales',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, PageComponent],
  templateUrl: './mentions-legales.html',
  styleUrl: './mentions-legales.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MentionsLegalesComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  /** Identité de l'éditeur / vendeur, source unique dans legal-info.ts. */
  protected readonly legal = LEGAL;

  /** Hébergeur du site. */
  protected readonly host = HOST;

  /**
   * Téléphone de l'éditeur. Obligatoire pour un vendeur à distance : le
   * consommateur doit pouvoir le joindre rapidement (art. L221-5 C. conso).
   */
  protected readonly phone = orMissing(
    LEGAL.phone,
    'numéro de téléphone auquel le client peut joindre l\'association'
  );

  /** Intitulé de la ligne TVA, selon que l'association est assujettie ou non. */
  protected readonly vatLabel = LEGAL.vatNumber
    ? 'Numéro de TVA intracommunautaire'
    : 'TVA';

  /**
   * Numéro de TVA si assujettie, mention de franchise en base sinon
   * (« TVA non applicable, article 293 B du CGI »).
   */
  protected readonly vat = orMissing(
    LEGAL.vatNumber ?? LEGAL.vatExemptionNotice,
    'numéro de TVA intracommunautaire, ou mention de franchise en base (article 293 B du CGI)'
  );

  /**
   * Identifiant unique ADEME au titre de la filière REP Textiles, obligatoire
   * dès lors que la structure met des vêtements sur le marché français sous sa
   * propre marque.
   */
  protected readonly ademeUniqueId = orMissing(
    SHOP_LEGAL.ademeUniqueId,
    'identifiant unique ADEME délivré lors de l\'adhésion à la filière REP Textiles (Refashion)'
  );

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Mentions Légales',
      description:
        'Mentions légales du site Team Divergentes : éditeur, hébergeur, activité de vente en ligne, propriété intellectuelle.',
      url: '/mentions-legales'
    });
  }
}
