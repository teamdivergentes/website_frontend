import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SponsorsService } from '../../../shared/services/sponsors.service';
import { Sponsor, SponsorLink, LinkType } from '../../../shared/models';

interface DialogData {
  sponsor: Sponsor;
}

/**
 * Dialog pour gérer les liens d'un sponsor
 */
@Component({
  selector: 'app-sponsor-links-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatCheckboxModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Liens de {{ data.sponsor.name }}</h2>

    <mat-dialog-content>
      <!-- Liste des liens -->
      @if (links().length > 0) {
        <div class="links-list">
          @for (link of links(); track link.id) {
            <div class="link-item" [class.primary]="link.isPrimary">
              <div class="link-info">
                <div class="link-header">
                  <strong>{{ link.label }}</strong>
                  @if (link.isPrimary) {
                    <span class="primary-badge">
                      <mat-icon>star</mat-icon>
                      Principal
                    </span>
                  }
                </div>
                <div class="link-meta">
                  <span class="link-type">{{ getLinkTypeLabel(link.type) }}</span>
                  <a [href]="link.url" target="_blank" rel="noopener" class="link-url">
                    {{ link.url }}
                    <mat-icon>open_in_new</mat-icon>
                  </a>
                </div>
              </div>
              <div class="link-actions">
                <button mat-icon-button
                        matTooltip="Modifier"
                        (click)="editLink(link)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button
                        color="warn"
                        matTooltip="Supprimer"
                        (click)="removeLink(link)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      } @else {
        <p class="empty-message">Aucun lien pour ce sponsor</p>
      }

      <!-- Formulaire d'ajout/édition -->
      <div class="add-section">
        <h3>{{ editingLink() ? 'Modifier le lien' : 'Ajouter un lien' }}</h3>
        <form [formGroup]="linkForm" (ngSubmit)="saveLink()">
          <mat-form-field appearance="outline">
            <mat-label>Label</mat-label>
            <input matInput formControlName="label" required />
            @if (linkForm.get('label')?.invalid && linkForm.get('label')?.touched) {
              <mat-error>Label requis</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>URL</mat-label>
            <input matInput formControlName="url" required />
            @if (linkForm.get('url')?.invalid && linkForm.get('url')?.touched) {
              <mat-error>URL requise</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Type</mat-label>
            <mat-select formControlName="type" required>
              <mat-option [value]="LinkType.WEBSITE">Site web</mat-option>
              <mat-option [value]="LinkType.TWITTER">Twitter</mat-option>
              <mat-option [value]="LinkType.INSTAGRAM">Instagram</mat-option>
              <mat-option [value]="LinkType.DISCORD">Discord</mat-option>
              <mat-option [value]="LinkType.PROMO_CODE">Code promo</mat-option>
              <mat-option [value]="LinkType.OTHER">Autre</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-checkbox formControlName="isPrimary">Lien principal</mat-checkbox>

          <div class="form-actions">
            @if (editingLink()) {
              <button mat-button type="button" (click)="cancelEdit()">Annuler</button>
            }
            <button mat-raised-button color="primary" type="submit" [disabled]="linkForm.invalid || loading()">
              <mat-icon>{{ editingLink() ? 'save' : 'add' }}</mat-icon>
              {{ editingLink() ? 'Enregistrer' : 'Ajouter' }}
            </button>
          </div>
        </form>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host {
      display: block;
    }

    mat-dialog-content {
      width: min(600px, 80vw);
      max-height: 80vh;
      overflow-x: hidden;
      overflow-y: auto;
      box-sizing: border-box;
    }

    .links-list {
      margin-bottom: 2rem;
    }

    .link-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      margin-bottom: 0.5rem;
      background: var(--card-bg, #1e1e1e);
      border: 1px solid var(--border, #333);
      border-radius: 8px;
      transition: all 0.2s;

      &.primary {
        border-color: var(--primary, #32D299);
      }

      &:hover {
        border-color: var(--primary, #32D299);
      }
    }

    .link-info {
      flex: 1;
      min-width: 0;
      overflow: hidden;

      .link-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;

        strong {
          color: var(--white, #fff);
        }

        .primary-badge {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--primary, #32D299);
          font-size: 0.75rem;

          mat-icon {
            font-size: 1rem;
            width: 1rem;
            height: 1rem;
          }
        }
      }

      .link-meta {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-size: 0.875rem;

        .link-type {
          color: var(--gray, #999);
          font-weight: 500;
        }

        .link-url {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--primary, #32D299);
          text-decoration: none;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;

          &:hover {
            text-decoration: underline;
          }

          mat-icon {
            flex-shrink: 0;
            font-size: 1rem;
            width: 1rem;
            height: 1rem;
          }
        }
      }
    }

    .link-actions {
      display: flex;
      gap: 0.5rem;
    }

    .empty-message {
      text-align: center;
      padding: 2rem;
      color: var(--gray, #999);
    }

    .add-section {
      margin-top: 2rem;
      padding: 1rem;
      background: var(--card-bg, #1e1e1e);
      border-radius: 8px;
      box-sizing: border-box;
      max-width: 100%;

      h3 {
        margin: 0 0 1rem 0;
        color: var(--white, #fff);
      }

      form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        max-width: 100%;
      }

      mat-form-field {
        width: 100%;
        max-width: 100%;
      }

      .form-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
      }
    }
  `]
})
export class SponsorLinksDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly sponsorsService = inject(SponsorsService);
  private readonly dialogRef = inject(MatDialogRef<SponsorLinksDialogComponent>);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly links = signal<SponsorLink[]>([...this.data.sponsor.links]);
  readonly editingLink = signal<SponsorLink | null>(null);

  readonly LinkType = LinkType;
  linkForm: FormGroup;

  constructor() {
    this.linkForm = this.fb.group({
      label: ['', Validators.required],
      url: ['', Validators.required],
      type: [LinkType.WEBSITE, Validators.required],
      isPrimary: [false]
    });
  }

  /**
   * Ajoute ou met à jour un lien
   */
  saveLink(): void {
    if (this.linkForm.invalid) {
      return;
    }

    this.loading.set(true);
    const dto = this.linkForm.value;

    const request = this.editingLink()
      ? this.sponsorsService.updateLink(this.data.sponsor.id, this.editingLink()!.id, dto)
      : this.sponsorsService.addLink(this.data.sponsor.id, dto);

    request.subscribe({
      next: () => {
        this.linkForm.reset({ type: LinkType.WEBSITE, isPrimary: false });
        this.editingLink.set(null);
        this.loading.set(false);
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Save link error:', err);
        this.loading.set(false);
        window.alert('Erreur lors de l\'enregistrement');
      }
    });
  }

  /**
   * Prépare l'édition d'un lien
   */
  editLink(link: SponsorLink): void {
    this.editingLink.set(link);
    this.linkForm.patchValue({
      label: link.label,
      url: link.url,
      type: link.type,
      isPrimary: link.isPrimary
    });
  }

  /**
   * Annule l'édition
   */
  cancelEdit(): void {
    this.editingLink.set(null);
    this.linkForm.reset({ type: LinkType.WEBSITE, isPrimary: false });
  }

  /**
   * Supprime un lien
   */
  removeLink(link: SponsorLink): void {
    if (!window.confirm('Voulez-vous vraiment supprimer ce lien ?')) {
      return;
    }

    this.sponsorsService.removeLink(this.data.sponsor.id, link.id).subscribe({
      next: () => {
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Remove link error:', err);
        window.alert('Erreur lors de la suppression');
      }
    });
  }

  /**
   * Retourne le label d'un type de lien
   */
  getLinkTypeLabel(type: LinkType): string {
    const labels: Record<LinkType, string> = {
      [LinkType.WEBSITE]: 'Site web',
      [LinkType.TWITTER]: 'Twitter',
      [LinkType.INSTAGRAM]: 'Instagram',
      [LinkType.DISCORD]: 'Discord',
      [LinkType.PROMO_CODE]: 'Code promo',
      [LinkType.OTHER]: 'Autre'
    };
    return labels[type];
  }
}
