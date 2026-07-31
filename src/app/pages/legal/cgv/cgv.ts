import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { LEGAL, SHOP_LEGAL, orMissing } from '../legal-info';

/**
 * Transforme un nombre de jours ouvrés en libellé, ou `null` si la valeur
 * n'est pas encore connue — pour que `orMissing` prenne le relais.
 */
function delayLabel(days: number | null): string | null {
  return days === null ? null : `${days} jours ouvrés`;
}

@Component({
  selector: 'app-cgv',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cgv.html',
  styleUrl: './cgv.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CgvComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  /** Identité du vendeur, lue depuis la source unique. */
  readonly legal = LEGAL;

  /** Téléphone obligatoire en vente à distance (art. L221-5 C. conso). */
  readonly phone = orMissing(LEGAL.phone, 'numéro de téléphone du vendeur');

  /**
   * Soit le numéro de TVA intracommunautaire, soit la mention de franchise en
   * base. Tant que ni l'un ni l'autre n'est renseigné, le trou reste visible.
   */
  readonly vatMention = orMissing(
    LEGAL.vatNumber ?? LEGAL.vatExemptionNotice,
    "numéro de TVA intracommunautaire ou mention de franchise en base (art. 293 B du CGI)"
  );

  readonly shippingDelay = orMissing(
    delayLabel(SHOP_LEGAL.shippingDelayBusinessDays),
    "délai maximal d'expédition, en jours ouvrés"
  );

  readonly carrierDelay = orMissing(
    delayLabel(SHOP_LEGAL.carrierDelayBusinessDays),
    "délai d'acheminement du transporteur, en jours ouvrés"
  );

  readonly returnAddress = orMissing(
    SHOP_LEGAL.returnAddress,
    'adresse de retour des produits rétractés'
  );

  readonly mediatorName = orMissing(
    SHOP_LEGAL.mediator.name,
    'nom du médiateur de la consommation'
  );

  readonly mediatorAddress = orMissing(
    SHOP_LEGAL.mediator.address,
    'adresse postale du médiateur'
  );

  readonly mediatorWebsite = orMissing(
    SHOP_LEGAL.mediator.website,
    'site de saisine du médiateur'
  );

  /** Qui supporte les frais de retour en cas de rétractation. */
  readonly returnCosts = SHOP_LEGAL.returnCostsBorneByCustomer
    ? "Les frais de retour restent à la charge du client."
    : "Les frais de retour sont pris en charge par Team Divergentes.";

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Conditions Générales de Vente',
      description:
        'Conditions générales de vente de la boutique Team Divergentes : prix, commande, paiement, livraison, rétractation, garanties légales et médiation.',
      url: '/conditions-generales-de-vente'
    });
  }
}
