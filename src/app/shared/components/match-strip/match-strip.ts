import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Match } from '../../models/match.model';
import { matchOutcome, outcomeAria, outcomeLabel } from '../../utils/match-outcome';

@Component({
  selector: 'app-match-strip',
  standalone: true,
  imports: [CommonModule, DatePipe, UpperCasePipe, RouterLink],
  templateUrl: './match-strip.html',
  styleUrls: ['./match-strip.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchStripComponent {
  readonly upcoming = input<Match | null>(null);
  readonly results = input<Match[]>([]);

  /**
   * Indique si le match dispose des deux scores (résultat calculable).
   * Sert à conditionner l'affichage du badge de résultat afin d'éviter
   * un rendu partiel du type « null-null » quand les scores sont manquants.
   */
  protected hasOutcome(match: Match): boolean {
    return matchOutcome(match) !== null;
  }

  /** Expose les helpers au template */
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

  /** Masque l'image si le logo adversaire est introuvable (URL cassée). */
  protected onLogoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}
