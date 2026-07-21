import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatchesService } from '../../../shared/services/matches.service';
import { MatchAdmin } from '../../../shared/models/match.model';
import { MatchDialogComponent } from './match-dialog.component';
import { ScoreDialogComponent } from './score-dialog.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-matches-admin',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatTooltipModule, DatePipe],
  templateUrl: './matches-admin.component.html',
  styleUrls: ['./matches-admin.component.scss'],
})
export class MatchesAdminComponent implements OnInit {
  private readonly matchesService = inject(MatchesService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal(false);
  readonly allMatches = this.matchesService.adminMatches;

  readonly upcomingMatches = computed(() => {
    const now = new Date();
    return this.allMatches()
      .filter(m => new Date(m.scheduledAt) > now)
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  });

  readonly pastMatches = computed(() => {
    const now = new Date();
    return this.allMatches()
      .filter(m => new Date(m.scheduledAt) <= now)
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
  });

  ngOnInit(): void {
    this.loadMatches();
  }

  private loadMatches(): void {
    this.loading.set(true);
    this.matchesService
      .loadAdminMatches()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Erreur lors du chargement', 'OK', { duration: 3000 });
        },
      });
  }

  scoreLabel(match: MatchAdmin): string {
    if (match.scoreDvg != null && match.scoreOpponent != null) {
      return `${match.scoreDvg} - ${match.scoreOpponent}`;
    }
    return '—';
  }

  statusLabel(match: MatchAdmin): string {
    const now = new Date();
    const scheduled = new Date(match.scheduledAt);
    if (scheduled > now) return 'À venir';
    if (match.scoreDvg != null && match.scoreOpponent != null) return 'Résultat';
    return 'En attente de score';
  }

  statusClass(match: MatchAdmin): string {
    const label = this.statusLabel(match);
    if (label === 'À venir') return 'badge-upcoming';
    if (label === 'Résultat') return 'badge-result';
    return 'badge-pending';
  }

  isPast(match: MatchAdmin): boolean {
    return new Date(match.scheduledAt) <= new Date();
  }

  openCreate(): void {
    const ref = this.dialog.open(MatchDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {},
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Match créé', 'OK', { duration: 2500 });
          this.loadMatches();
        }
      });
  }

  openEdit(match: MatchAdmin): void {
    const ref = this.dialog.open(MatchDialogComponent, {
      width: '640px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { match },
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Match mis à jour', 'OK', { duration: 2500 });
          this.loadMatches();
        }
      });
  }

  openScore(match: MatchAdmin): void {
    const ref = this.dialog.open(ScoreDialogComponent, {
      width: '400px',
      maxWidth: '95vw',
      data: { match },
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (result) {
          this.snackBar.open('Score enregistré', 'OK', { duration: 2500 });
          this.loadMatches();
        }
      });
  }

  confirmDelete(match: MatchAdmin): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '95vw',
      data: {
        title: 'Confirmer la suppression',
        message: `Supprimer le match DVG vs « ${match.opponentName} » ?`,
      },
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (confirmed) {
          this.matchesService
            .deleteMatch(match.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => this.snackBar.open('Match supprimé', 'OK', { duration: 2500 }),
              error: () => this.snackBar.open('Erreur', 'OK', { duration: 3000 }),
            });
        }
      });
  }
}
