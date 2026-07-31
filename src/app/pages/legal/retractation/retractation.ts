import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { LEGAL, SHOP_LEGAL, orMissing } from '../legal-info';

/** État du bouton de copie du formulaire type. */
export type CopyState = 'idle' | 'copied' | 'error';

@Component({
  selector: 'app-retractation',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './retractation.html',
  styleUrl: './retractation.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RetractationComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  readonly legal = LEGAL;

  readonly phone = orMissing(LEGAL.phone, 'numéro de téléphone du vendeur');

  readonly returnAddress = orMissing(
    SHOP_LEGAL.returnAddress,
    'adresse de retour des produits rétractés'
  );

  /** Qui supporte les frais de renvoi du produit. */
  readonly returnCosts = SHOP_LEGAL.returnCostsBorneByCustomer
    ? 'Les frais directs de renvoi du produit sont à la charge du client.'
    : 'Les frais directs de renvoi du produit sont pris en charge par Team Divergentes.';

  readonly copyState = signal<CopyState>('idle');

  /**
   * Version texte du formulaire type de l'annexe à l'article R221-1 du Code de
   * la consommation. Sert au bouton « copier » : le formulaire doit être
   * utilisable, pas seulement lisible.
   */
  readonly formTemplate = [
    'FORMULAIRE TYPE DE RÉTRACTATION',
    '',
    "(Veuillez compléter et renvoyer le présent formulaire uniquement si vous souhaitez vous rétracter du contrat.)",
    '',
    `À l'attention de ${LEGAL.name}, ${this.returnAddress}, ${LEGAL.email}, ${this.phone} :`,
    '',
    "Je/nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat portant sur la vente du bien (*)/pour la prestation de services (*) ci-dessous :",
    '',
    'Commandé le (*)/reçu le (*) :',
    '',
    'Nom du (des) consommateur(s) :',
    '',
    'Adresse du (des) consommateur(s) :',
    '',
    "Signature du (des) consommateur(s) (uniquement en cas de notification du présent formulaire sur papier) :",
    '',
    'Date :',
    '',
    '(*) Rayez la mention inutile.'
  ].join('\n');

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Droit de rétractation',
      description:
        "Droit de rétractation de 14 jours applicable aux commandes de la boutique Team Divergentes, exception des produits personnalisés et formulaire type de rétractation.",
      url: '/retractation'
    });
  }

  /**
   * Accès réel au presse-papiers, isolé pour rester spyable en test : l'API
   * n'existe pas hors contexte sécurisé et ne peut pas être stubée autrement.
   */
  writeToClipboard(text: string): Promise<void> {
    return navigator.clipboard.writeText(text);
  }

  /** Copie le formulaire type dans le presse-papiers. */
  async copyForm(): Promise<void> {
    try {
      await this.writeToClipboard(this.formTemplate);
      this.copyState.set('copied');
    } catch {
      // Presse-papiers indisponible (permission refusée, contexte non sécurisé) :
      // le texte reste sélectionnable à l'écran, on le signale simplement.
      this.copyState.set('error');
    }
  }

  /** Ouvre la boîte d'impression du navigateur. */
  printForm(): void {
    globalThis.print();
  }
}
