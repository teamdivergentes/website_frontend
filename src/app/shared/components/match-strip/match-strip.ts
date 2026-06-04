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
  readonly compact = input(true);

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
}
