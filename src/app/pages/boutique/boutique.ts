import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ShopProduct } from '../../shared/models/shop-product.model';
import { ShopService } from '../../shared/services/shop.service';
import { CartService } from '../../shared/services/cart.service';
import { SeoService } from '../../shared/services/seo.service';
import {
  MATERIAL,
  ORIGIN,
  TAX_LABEL,
  WEIGHT,
  asLabel,
  metaFor,
  reference,
  splitTitle,
} from './jersey-presentation';

/**
 * Une déclinaison telle que la page la présente : le produit du catalogue, plus
 * ce dont la mise en page a besoin (référence d'atelier, découpe du titre pour
 * l'accent vert, sens d'alternance de la section).
 */
export interface JerseySection {
  product: ShopProduct;
  reference: string;
  /** Le nom, jusqu'au dernier séparateur inclus. */
  titleLead: string;
  /** Ce qui suit le dernier séparateur : le nom d'équipe, mis en accent. */
  titleAccent: string;
  eyebrow: string;
  /** Le laïus du maillot, saisi en admin. */
  story: string | null;
  /** Ce qui distingue la déclinaison : tailles, flocage. */
  meta: string[];
  /** Vrai une déclinaison sur deux : le visuel passe à droite. */
  reversed: boolean;
}

@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  templateUrl: './boutique.html',
  styleUrls: ['./boutique.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoutiqueComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly shopService = inject(ShopService);
  private readonly cartService = inject(CartService);

  readonly products = this.shopService.products;
  readonly shopEnabled = this.shopService.shopEnabled;
  readonly cartCount = this.cartService.itemCount;
  readonly loading = signal(true);
  readonly error = signal<string | undefined>(undefined);

  /** Même libellé « TTC » que sur la fiche produit (art. L112-1 C. conso). */
  readonly taxLabel = TAX_LABEL;

  /**
   * Le catalogue est présenté comme une suite de sections, une par déclinaison,
   * dans l'ordre `position` piloté depuis l'admin. Pas de produit « mis en
   * avant » : les maillots ont tous le même statut.
   */
  readonly jerseys = computed<JerseySection[]>(() =>
    this.products().map((product, index) => {
      const { lead, accent } = splitTitle(product.name);

      return {
        product,
        reference: reference(product),
        titleLead: lead,
        titleAccent: accent,
        eyebrow: product.shortDescription ? asLabel(product.shortDescription) : 'collection 2026',
        story: product.description,
        meta: metaFor(product),
        reversed: index % 2 === 1,
      };
    }),
  );

  /**
   * Le titre du hero compte les déclinaisons réellement en ligne : le catalogue
   * n'expose que les maillots actifs, et annoncer « trois équipes » alors qu'un
   * seul est publié serait faux.
   */
  private static readonly COUNT_WORDS = ['', 'une', 'deux', 'trois', 'quatre', 'cinq', 'six'];

  readonly heroCount = computed(() => {
    const total = this.products().length;
    const word = BoutiqueComponent.COUNT_WORDS[total];

    if (!word) {
      return { accent: 'toutes nos', noun: 'équipes' };
    }
    return { accent: word, noun: total === 1 ? 'équipe' : 'équipes' };
  });

  /**
   * Le hero s'ouvre sur la seule vidéo : le titre est absent de l'écran de
   * chargement et se révèle au premier défilement. Le seuil est bas — il s'agit
   * de répondre à l'intention de descendre, pas de faire attendre.
   */
  private static readonly TITLE_REVEAL_PX = 24;

  readonly titleRevealed = signal(false);

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.titleRevealed.set(window.scrollY > BoutiqueComponent.TITLE_REVEAL_PX);
  }

  /**
   * La vidéo démarre muette : Chrome refuse l'autoplay sonore, et un son qui
   * part seul à l'ouverture d'une page se subit plus qu'il ne s'écoute. Le
   * bouton le rend disponible à qui le veut.
   */
  readonly soundOn = signal(false);

  toggleSound(): void {
    this.soundOn.update((on) => !on);
  }

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Boutique',
      description:
        `Boutique officielle Team Divergentes : maillots de la collection 2026, personnalisables au flocage. ${MATERIAL}, ${WEIGHT}, ${ORIGIN}.`,
      url: '/boutique',
    });
    this.loadCatalog();
  }

  private loadCatalog(): void {
    this.loading.set(true);
    this.error.set(undefined);
    this.shopService.loadCatalog().subscribe({
      next: () => this.loading.set(false),
      error: () => {
        this.loading.set(false);
        this.error.set('La boutique est momentanément indisponible.');
      },
    });
  }

  /**
   * L'exposition des partenaires est contractuelle. Elle tient sur un bandeau
   * posé, sans défilement : deux logos qui tournent en boucle attirent l'œil
   * loin des maillots sans rien apporter à personne.
   */
  readonly sponsors = [
    {
      url: 'https://www.behance.net/Pulsarcorp',
      img: 'assets/img/sponsors/pulsar.svg',
      alt: 'Pulsar Corp',
    },
    {
      url: 'https://eliminate.fr/',
      img: 'assets/img/sponsors/LMN8.svg',
      alt: 'LMN8',
    },
  ];
}
