import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SeoService } from '../../../shared/services/seo.service';
import { CartService } from '../../../shared/services/cart.service';
import { ShopService } from '../../../shared/services/shop.service';
import { OrderConfirmation } from '../../../shared/models/shop-product.model';
import { SHOP_LEGAL, orMissing } from '../../legal/legal-info';
import { PageComponent } from '../../../shared/components/layout/page.component';

/**
 * Combien de fois la page redemande le recapitulatif tant que le paiement n'est
 * pas confirme.
 *
 * Le decalage est structurel : Stripe redirige le navigateur immediatement et
 * envoie `checkout.session.completed` en parallele. Le client arrive donc
 * souvent avant le webhook, sur une commande encore `PENDING` alors que
 * l'argent est bien encaisse. Quelques relectures suffisent dans l'immense
 * majorite des cas ; au-dela, la page le dit plutot que de l'inventer.
 */
const CONFIRMATION_RETRIES = 4;
const CONFIRMATION_RETRY_DELAY_MS = 2000;

/**
 * Ce que la page sait reellement du paiement. Le distinguer explicitement est
 * l'objet meme de cet ecran : la version precedente affirmait dans tous les cas
 * qu'un recu venait de partir, y compris sur une arrivee directe par favori.
 */
export type MerciState =
  /** Le webhook a confirme : tout ce que la page affirme est verifie. */
  | 'paid'
  /** Commande retrouvee, paiement pas encore confirme par le webhook. */
  | 'pending'
  /** Aucun identifiant de session, ou recapitulatif illisible. */
  | 'unknown';

@Component({
  selector: 'app-boutique-merci',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, RouterLink, PageComponent],
  templateUrl: './merci.component.html',
  styleUrls: ['./merci.component.scss'],
})
export class MerciComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly cartService = inject(CartService);
  private readonly shopService = inject(ShopService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly confirmation = signal<OrderConfirmation | null>(null);

  /**
   * Vrai le temps de la premiere lecture seulement : les relectures qui suivent
   * ne doivent pas faire clignoter la page entre squelette et contenu.
   */
  readonly loading = signal(false);

  /** Vrai quand Stripe a rapporte un identifiant de session. */
  readonly hasSession = signal(false);

  readonly state = computed<MerciState>(() => {
    if (!this.hasSession()) {
      return 'unknown';
    }
    const order = this.confirmation();
    if (!order) {
      return this.loading() ? 'pending' : 'unknown';
    }
    return order.paid ? 'paid' : 'pending';
  });

  /** Prenom du client, quand Stripe l'a transmis. */
  readonly firstName = computed(() => this.confirmation()?.firstName ?? null);

  /**
   * Le titre s'adresse au client quand on connait son prenom, et reste correct
   * quand on ne le connait pas : la page doit rester presentable si le
   * recapitulatif n'a pas pu etre charge.
   */
  readonly greeting = computed(() => {
    const name = this.firstName();
    return name ? `Merci ${name}` : 'Merci pour votre commande';
  });

  /** Nombre total d'articles, pour accorder le recapitulatif. */
  readonly itemCount = computed(() =>
    (this.confirmation()?.items ?? []).reduce((sum, item) => sum + item.quantity, 0),
  );

  /**
   * Delais annonces apres paiement, lus dans `SHOP_LEGAL` comme sur la fiche
   * produit et le panier.
   *
   * Cette page annoncait « une fois par semaine » puis « quelques jours de
   * production », quand la fiche produit annoncait 25 jours ouvres et le mail
   * client 30 jours. Trois textes pour un meme engagement, dont le delai lie
   * le vendeur (art. L216-1 C. conso). Le marqueur « a completer » s'affiche
   * tant qu'une valeur manque : un engagement contractuel ne se devine pas.
   */
  readonly shippingDelay = orMissing(
    SHOP_LEGAL.shippingDelayBusinessDays === null
      ? null
      : `${SHOP_LEGAL.shippingDelayBusinessDays} jours ouvrés`,
    "délai d'expédition, en jours ouvrés",
  );

  readonly carrierDelay = orMissing(
    SHOP_LEGAL.carrierDelayBusinessDays === null
      ? null
      : `${SHOP_LEGAL.carrierDelayBusinessDays} jours ouvrés`,
    "délai d'acheminement, en jours ouvrés",
  );

  private attemptsLeft = CONFIRMATION_RETRIES;

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Merci pour votre commande',
      description: 'Confirmation de commande sur la boutique Team Divergentes.',
      url: '/boutique/merci',
      // Page de retour de paiement : elle n'a rien a faire dans un index, et
      // son URL porte desormais un identifiant de session.
      noIndex: true,
    });

    // Rien a rendre cote serveur : le recapitulatif depend d'un identifiant que
    // seul le navigateur qui vient de payer possede, et la page est noindex.
    // Le laisser au client evite aussi de faire tourner les relectures sous
    // Node.
    if (!this.isBrowser) {
      return;
    }

    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (!sessionId) {
      // Arrivee directe : favori, historique, lien colle dans un salon Discord.
      // Le panier N'EST PAS vide — `clear()` ecrit dans le `localStorage`, et un
      // panier de trois maillots avec leurs flocages ne se reconstitue pas de
      // memoire. Seul un retour de Stripe prouve un paiement.
      return;
    }

    this.hasSession.set(true);
    this.loading.set(true);
    this.fetch(sessionId);
  }

  private fetch(sessionId: string): void {
    this.shopService.getOrderConfirmation(sessionId).subscribe({
      next: (confirmation) => {
        this.loading.set(false);
        this.confirmation.set(confirmation);
        // Le panier n'est vidé qu'ici, sur un recapitulatif reellement recupere :
        // c'est la seule preuve qu'une commande existe pour cette session, que le
        // webhook Stripe l'ait deja confirmee ou non. Idempotent sur les
        // relectures suivantes.
        this.cartService.clear();

        if (!confirmation.paid && this.attemptsLeft > 0) {
          this.attemptsLeft -= 1;
          this.scheduleRetry(sessionId);
        }
      },
      // Un recapitulatif indisponible ne remet pas le paiement en cause, mais
      // la page cesse alors d'affirmer ce qu'elle ne peut plus verifier : elle
      // retombe sur l'etat `unknown`, et le panier n'est PAS vide — rien ne
      // prouve encore qu'une commande existe pour cette session.
      error: () => this.loading.set(false),
    });
  }

  private scheduleRetry(sessionId: string): void {
    const timer = setTimeout(() => this.fetch(sessionId), CONFIRMATION_RETRY_DELAY_MS);
    this.destroyRef.onDestroy(() => clearTimeout(timer));
  }
}
