import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
  selector: 'app-boutique-merci',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="merci">
      <h1>Merci pour votre commande</h1>
      <p>
        Votre paiement a bien été pris en compte. Vous recevez un reçu par e-mail dans les
        prochaines minutes.
      </p>
      <p>
        Les commandes sont transmises à notre fabricant une fois par semaine. Comptez ensuite
        quelques jours de production avant l'expédition.
      </p>
      <a routerLink="/boutique">Retour à la boutique</a>
    </section>
  `,
  styles: [
    `
      .merci {
        max-width: 640px;
        margin: 0 auto;
        padding: 64px 24px;
        text-align: center;
      }
    `,
  ],
})
export class MerciComponent implements OnInit {
  private readonly seoService = inject(SeoService);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Merci pour votre commande',
      description: 'Confirmation de commande sur la boutique Team Divergentes.',
      url: '/boutique/merci',
    });
  }
}
