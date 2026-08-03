import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { CartService } from '../../../shared/services/cart.service';
import { PageComponent } from '../../../shared/components/layout/page.component';

@Component({
  selector: 'app-boutique-merci',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, PageComponent],
  template: `
    <dvg-page container="xs">
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
    </dvg-page>
  `,
  styles: [
    `
      // max-width, marge et padding-block venaient d'ici (640px) : portes
      // desormais par \`<dvg-page container="xs">\` (960px).
      .merci {
        text-align: center;
      }
    `,
  ],
})
export class MerciComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly cartService = inject(CartService);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Merci pour votre commande',
      description: 'Confirmation de commande sur la boutique Team Divergentes.',
      url: '/boutique/merci',
    });

    // Stripe ne redirige ici qu'apres un paiement accepte : sans ce vidage, le
    // client retrouverait son panier intact et pourrait repayer la meme
    // commande. Une annulation renvoie sur /boutique/panier, qui le conserve.
    this.cartService.clear();
  }
}
