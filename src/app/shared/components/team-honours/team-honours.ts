import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Trophy } from '../../models/trophy.model';
import { placementAria, placementLabel } from '../../utils/trophy-placement';

/** Au-delà de ce seuil, on tronque et on renvoie vers la page palmarès. */
const MAX_LIGNES = 4;

@Component({
  selector: 'app-team-honours',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './team-honours.html',
  styleUrls: ['./team-honours.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamHonoursComponent {
  readonly trophies = input<Trophy[]>([]);

  /** Trophées triés du plus récent au plus ancien, tronqués à MAX_LIGNES. */
  readonly visibles = computed<Trophy[]>(() =>
    [...this.trophies()]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, MAX_LIGNES),
  );

  readonly total = computed<number>(() => this.trophies().length);

  readonly tronque = computed<boolean>(() => this.total() > MAX_LIGNES);

  protected label(placement: number): string {
    return placementLabel(placement);
  }

  /**
   * Rang en clair (« 1re place ») destiné aux lecteurs d'écran, là où l'affichage
   * montre une forme abrégée. Le template le rend dans un span visuellement
   * masqué plutôt que via un attribut de libellé accessible, interdit par ARIA
   * in HTML sur un span sans rôle — et un rôle graphique serait rejeté par la
   * règle SonarQube Web:S6819.
   */
  protected aria(placement: number): string {
    return placementAria(placement);
  }

  /** Teinte de la pastille de rang. Au-delà du podium, neutre. */
  protected rankClass(placement: number): 'gold' | 'silver' | 'bronze' | 'neutral' {
    if (placement === 1) return 'gold';
    if (placement === 2) return 'silver';
    if (placement === 3) return 'bronze';
    return 'neutral';
  }
}
