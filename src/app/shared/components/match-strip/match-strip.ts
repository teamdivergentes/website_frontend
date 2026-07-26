import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule, DatePipe, NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Match } from '../../models/match.model';
import { matchOutcome, outcomeAria, outcomeLabel } from '../../utils/match-outcome';
import { formatRelativeSchedule } from '../../utils/match-schedule';
import { opponentInitials } from '../../utils/opponent-initials';

/**
 * Trois états possibles :
 *  - `upcoming`    : un match est programmé — état nominal.
 *  - `last-result` : aucun match programmé, on met en avant le dernier résultat
 *                    avec sa date en clair, pour que l'ancienneté soit visible.
 *  - `empty`       : aucune donnée — le composant ne rend rien.
 */
export type MatchStripMode = 'upcoming' | 'last-result' | 'empty';

@Component({
  selector: 'app-match-strip',
  standalone: true,
  imports: [CommonModule, DatePipe, NgTemplateOutlet, RouterLink],
  templateUrl: './match-strip.html',
  styleUrls: ['./match-strip.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchStripComponent {
  readonly upcoming = input<Match | null>(null);
  readonly results = input<Match[]>([]);

  readonly mode = computed<MatchStripMode>(() => {
    if (this.upcoming()) return 'upcoming';
    if (this.results().length > 0) return 'last-result';
    return 'empty';
  });

  /** Résultat le plus récent — les résultats arrivent déjà triés du plus récent au plus ancien. */
  readonly lastResult = computed<Match | null>(() => this.results()[0] ?? null);

  /**
   * Échéance en langage relatif. Recalculée à chaque rendu, sans timer :
   * la granularité au jour ne justifie pas un rafraîchissement, et un
   * `setInterval` casserait le zoneless sans bénéfice (cf. spec §4).
   */
  readonly relativeSchedule = computed<string>(() => {
    const match = this.upcoming();
    return match ? formatRelativeSchedule(match.scheduledAt) : '';
  });

  /** Les 3 résultats affichés en pastilles de forme, du plus ancien au plus récent. */
  readonly formResults = computed<Match[]>(() => this.results().slice(0, 3).reverse());

  protected hasOutcome(match: Match): boolean {
    return matchOutcome(match) !== null;
  }

  protected getOutcomeLabel(match: Match): string {
    const outcome = matchOutcome(match);
    return outcome ? outcomeLabel(outcome) : '';
  }

  protected getOutcomeClass(match: Match): string {
    const outcome = matchOutcome(match);
    return outcome ?? '';
  }

  protected getOutcomeAria(match: Match): string {
    return outcomeAria(match);
  }

  /** Initiales de repli quand l'adversaire n'a pas de logo. */
  protected initials(name: string): string {
    return opponentInitials(name);
  }

  /**
   * Infobulle d'une pastille de forme : adversaire, score et date.
   * Seul endroit où l'obsolescence resterait invisible sans cette mention.
   */
  protected formTitle(match: Match): string {
    const date = new Date(match.scheduledAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `${outcomeAria(match)} — ${date}`;
  }

  /** Masque l'image si le logo adversaire est introuvable (URL cassée). */
  protected onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
