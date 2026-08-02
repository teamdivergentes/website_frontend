import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Un maillon du fil d'Ariane.
 *
 * Volontairement identique a la forme attendue par
 * SeoService.getBreadcrumbListJsonLd : les pages construisent UN seul tableau et
 * le passent aux deux, au balisage JSON-LD et a ce composant. C'est ce qui
 * empeche le chemin affiche de diverger du chemin declare a Google.
 */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Fil d'Ariane des pages de detail du site public.
 *
 * Decision PO du 2026-08-03 : fil d'Ariane sur toutes les pages de detail, et
 * suppression des boutons de retour.
 *
 * Le raisonnement, pour qui relira ce fichier : un bouton de retour dans la page
 * duplique celui du navigateur, et surtout il ment quand le visiteur arrive
 * directement — depuis un moteur de recherche ou un partage social. Or ce site
 * travaille activement ce trafic entrant (gate SEO bloquante, EPIC-29 sur le
 * rendu serveur et les previews sociales), donc l'arrivee directe sur une page
 * de detail est le cas nominal, pas l'exception. Le fil d'Ariane, lui, indique
 * la position quel que soit le chemin d'arrivee et satisfait le critere WCAG
 * 2.4.8.
 *
 * Le dernier maillon est la page courante : il porte aria-current et n'est pas
 * cliquable.
 */
@Component({
  selector: 'dvg-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="dvg-breadcrumb" [attr.aria-label]="label()">
      <ol class="dvg-breadcrumb__list">
        @for (item of items(); track item.url; let last = $last) {
          <li class="dvg-breadcrumb__item">
            @if (last) {
              <span class="dvg-breadcrumb__current" aria-current="page">{{ item.name }}</span>
            } @else {
              <a class="dvg-breadcrumb__link" [routerLink]="item.url">{{ item.name }}</a>
              <span class="dvg-breadcrumb__separator" aria-hidden="true">&rsaquo;</span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
  styleUrl: './breadcrumb.component.scss',
})
export class BreadcrumbComponent {
  /**
   * Le chemin, de la racine a la page courante incluse. Le meme tableau que
   * celui passe a SeoService.getBreadcrumbListJsonLd.
   */
  readonly items = input.required<BreadcrumbItem[]>();

  readonly label = input('Fil d’Ariane');
}
