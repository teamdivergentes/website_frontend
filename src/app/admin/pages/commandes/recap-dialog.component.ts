import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { PendingBatch } from '../../../shared/models/order.model';

@Component({
  selector: 'app-recap-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Récapitulatif — {{ data.count }} commande(s)</h2>
    <mat-dialog-content>
      @if (data.count === 0) {
        <p>Aucune commande en attente de transmission.</p>
      } @else {
        <p class="hint">
          Copiez ce récapitulatif dans votre mail au marchand, puis revenez marquer le lot
          comme transmis.
        </p>
        <pre class="recap">{{ data.recapText }}</pre>
        @if (copied()) {
          <p class="copied" role="status">Récapitulatif copié.</p>
        }
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="null">Fermer</button>
      @if (data.count > 0) {
        <button mat-button type="button" (click)="copyRecap()">Copier le texte</button>
        <button mat-raised-button color="primary" type="button" (click)="downloadCsv()">
          Télécharger le CSV
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: min(700px, 92vw);
      }
      .recap {
        white-space: pre-wrap;
        word-break: break-word;
        background: var(--admin-accent-bg-subtle);
        padding: 12px;
        border-radius: var(--admin-radius-xs);
        font-size: 0.85rem;
      }
      .hint {
        color: rgba(255, 255, 255, 0.7);
      }
      .copied {
        color: var(--admin-accent);
      }
    `,
  ],
})
export class RecapDialogComponent {
  readonly data = inject<PendingBatch>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<RecapDialogComponent>);

  readonly copied = signal(false);

  async copyRecap(): Promise<void> {
    await navigator.clipboard.writeText(this.data.recapText);
    this.copied.set(true);
  }

  downloadCsv(): void {
    const blob = new Blob([this.data.csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'commandes-a-transmettre.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
