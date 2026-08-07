import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopService } from '../../../shared/services/shop.service';
import { CartService } from '../../../shared/services/cart.service';
import { SeoService } from '../../../shared/services/seo.service';
import { AuthService } from '../../../../shared/services/api/auth.service';
import { SHOP_LEGAL, orMissing } from '../../legal/legal-info';
import { ShippingMethod } from '../../../shared/models/shop-product.model';
import { PageComponent } from '../../../shared/components/layout/page.component';

@Component({
  selector: 'app-boutique-panier',
  standalone: true,
  imports: [DecimalPipe, RouterLink, PageComponent],
  templateUrl: './panier.component.html',
  styleUrls: ['./panier.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PanierComponent implements OnInit {
  private readonly cartService = inject(CartService);
  private readonly shopService = inject(ShopService);
  private readonly seoService = inject(SeoService);
  private readonly auth = inject(AuthService);

  readonly lines = this.cartService.detailedLines;
  readonly subtotalCents = this.cartService.subtotalCents;
  readonly shippingCents = this.cartService.shippingCents;
  readonly totalCents = this.cartService.totalCents;
  readonly shippingMethod = this.cartService.shippingMethod;
  readonly shippingIsFree = this.cartService.shippingIsFree;
  readonly missingForFreeShippingCents = this.cartService.missingForFreeShippingCents;
  readonly shippingStandardCents = this.shopService.shippingStandardCents;
  readonly shippingExpressCents = this.shopService.shippingExpressCents;
  readonly freeShippingThresholdCents = this.shopService.freeShippingThresholdCents;

  /** La franchise ne s'affiche que si un seuil est réglé. */
  readonly showsFreeShipping = computed(() => this.freeShippingThresholdCents() > 0);

  /**
   * Progression vers la franchise, en pourcentage. Un montant restant ne dit
   * pas si l'on en est proche ; la jauge le montre d'un coup d'œil.
   */
  readonly freeShippingPercent = computed(() => {
    const threshold = this.freeShippingThresholdCents();
    if (threshold <= 0) {
      return 0;
    }
    return Math.min(100, Math.round((this.subtotalCents() / threshold) * 100));
  });

  selectShippingMethod(method: ShippingMethod): void {
    this.cartService.setShippingMethod(method);
  }

  /**
   * Zone de livraison. Le récapitulatif n'a la place que du libellé court, mais
   * la ligne de délai qui le suit énumère les pays : le panier est le dernier
   * écran avant le paiement, un client hors zone doit pouvoir s'en apercevoir
   * avant d'arriver sur une page Stripe où son pays n'est pas proposé.
   */
  readonly shippingZoneShort = SHOP_LEGAL.shippingZoneShortLabel;
  readonly shippingZone = SHOP_LEGAL.shippingZoneLabel;

  /**
   * Délais annoncés au panier : le délai de livraison engage le vendeur
   * (art. L216-1 C. conso), il doit donc être visible avant le paiement. Tant
   * qu'il n'est pas renseigné, le marqueur « à compléter » s'affiche.
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

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly error = signal<string | undefined>(undefined);
  readonly termsAccepted = signal(false);

  // ----------------------------------------------------------------
  // Tarif réservé
  //
  // Le bouton n'est qu'un raccourci d'appel. L'autorisation vit entièrement
  // côté serveur : la route est refusée à qui ne porte pas la permission, et
  // le barème y est déduit du jeton. Le masquer évite de proposer une action
  // qui échouerait, ce n'est pas une mesure de sécurité.
  //
  // Le montant n'apparaît qu'à l'étape Stripe : le prix coûtant se déduit des
  // coûts fournisseurs, et l'afficher dans les totaux du panier en ferait un
  // indicateur permanent des marges négociées.
  // ----------------------------------------------------------------

  /**
   * Doit correspondre à `PERMISSIONS.BOUTIQUE_RETAIL` côté serveur. Les deux
   * dépôts ne partagent rien : une divergence ferait disparaître le bouton
   * pour des comptes qui y ont droit, sans autre symptôme.
   */
  private static readonly RETAIL_PERMISSION = 'boutique:retail';

  /** Vrai pour un compte habilité à commander au prix coûtant. */
  readonly canBuyAtRetail = computed(() =>
    this.auth.permissions().includes(PanierComponent.RETAIL_PERMISSION),
  );

  /** Distingue les deux boutons pendant l'aller-retour vers Stripe. */
  readonly retailSubmitting = signal(false);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Panier',
      description: 'Votre panier — boutique officielle Team Divergentes.',
      url: '/boutique/panier',
    });

    // Le catalogue porte les prix : sans lui, le panier ne peut rien afficher.
    this.shopService.loadCatalog().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set('La boutique est momentanément indisponible.');
      },
    });
  }

  updateQuantity(index: number, quantity: number): void {
    this.cartService.updateQuantity(index, quantity);
  }

  remove(index: number): void {
    this.cartService.remove(index);
  }

  checkout(): void {
    this.startCheckout('PUBLIC');
  }

  /**
   * Paiement du panier entier au prix coûtant.
   *
   * Le tarif réservé s'achetait depuis la fiche produit, article par article.
   * C'était le contraire de son usage : on l'emploie pour une commande groupée
   * — un jeu de maillots pour une équipe, une dotation d'événement — et le
   * serveur accepte depuis toujours jusqu'à 10 lignes par session. La
   * contrainte ne venait que du bouton.
   *
   * Les CGV sont exigées ici aussi : le barème change, la vente non.
   */
  checkoutAtRetail(): void {
    this.startCheckout('RETAIL');
  }

  private startCheckout(tier: 'PUBLIC' | 'RETAIL'): void {
    const lines = this.lines();
    if (lines.length === 0 || !this.termsAccepted() || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.retailSubmitting.set(tier === 'RETAIL');
    this.error.set(undefined);

    // Aucun montant n'est transmis : le serveur les recalcule depuis sa base.
    // La charge utile est rigoureusement la même pour les deux barèmes — aucun
    // drapeau de tarif ne transite, c'est la route qui décide, et le serveur
    // déduit le barème du jeton.
    const payload = {
      shippingMethod: this.shippingMethod(),
      items: lines.map((line) => ({
        productId: line.productId,
        size: line.size,
        quantity: line.quantity,
        ...(line.flockingText ? { flockingText: line.flockingText } : {}),
      })),
    };

    const request$ =
      tier === 'RETAIL'
        ? this.shopService.createRetailCheckout(payload)
        : this.shopService.createCheckout(payload);

    request$.subscribe({
      next: (result) => this.redirectToCheckout(result.url),
      error: (err: { status?: number; error?: { message?: string | string[] } }) => {
        this.submitting.set(false);
        this.retailSubmitting.set(false);
        this.error.set(this.checkoutErrorMessage(err));
      },
    });
  }

  /**
   * Traduit l'échec en une phrase que le client peut lire et sur laquelle il
   * peut agir.
   *
   * Le message du serveur était rendu tel quel : une recette a fait apparaître
   * « ThrottlerException: Too Many Requests » en toutes lettres sous le bouton.
   * Le tri se fait donc sur le statut, et non sur le corps de la réponse.
   *
   * Le 400 est la seule exception : il porte du sens métier — taille
   * indisponible, flocage refusé — mais seulement quand c'est une phrase. Le
   * `ValidationPipe` renvoie un tableau de messages de DTO, illisible pour un
   * acheteur.
   *
   * Toutes les réponses disent qu'aucun paiement n'a été lancé : le clic n'a
   * jamais atteint Stripe, c'est certain, et c'est la seule question que se
   * pose quelqu'un dont le paiement vient d'échouer.
   */
  private checkoutErrorMessage(err: {
    status?: number;
    error?: { message?: string | string[] };
  }): string {
    const message = err?.error?.message;

    if (err?.status === 400 && typeof message === 'string') {
      return `${message} Aucun paiement n'a été lancé.`;
    }
    if (err?.status === 429) {
      return "Trop de tentatives. Patientez une minute avant de réessayer, aucun paiement n'a été lancé.";
    }
    if (err?.status === 0) {
      return "Connexion perdue. Vérifiez votre connexion et réessayez, aucun paiement n'a été lancé.";
    }
    return "Le paiement est momentanément indisponible. Réessayez dans quelques minutes, aucun paiement n'a été lancé.";
  }

  /**
   * Redirection reelle vers Stripe Checkout, isolee pour rester spyable dans
   * les tests : une affectation de location.href recharge la page et
   * deconnecte le runner Karma.
   */
  redirectToCheckout(url: string): void {
    globalThis.location.href = url;
  }
}
