import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { TwitchChannelsService } from '../../../shared/services/twitch-channels.service';
import { TeamMember } from '../../../shared/models';
import { TwitchChannel, CreateTwitchChannelDto, UpdateTwitchChannelDto } from '../../../shared/models/twitch-channel.model';
import { environment } from '../../../../environments/environment';

export interface TwitchChannelDialogData {
  channel?: TwitchChannel;
}

interface TeamMemberOption {
  id: number;
  label: string;
}

/** Regex Twitch : 4–25 caractères alphanumériques ou underscore */
const TWITCH_USERNAME_PATTERN = /^\w{4,25}$/;

@Component({
  selector: 'app-twitch-channel-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Modifier la chaîne' : 'Nouvelle chaîne Twitch' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="channel-form">

        <!-- Pseudo Twitch -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Pseudo Twitch <span class="required">*</span></mat-label>
          <input matInput formControlName="twitchUsername" placeholder="ex: TeamDivergentes" />
          @if (form.get('twitchUsername')?.hasError('required') && form.get('twitchUsername')?.touched) {
            <mat-error>Le pseudo est obligatoire</mat-error>
          } @else if (form.get('twitchUsername')?.hasError('pattern') && form.get('twitchUsername')?.touched) {
            <mat-error>4–25 caractères : lettres, chiffres ou underscore uniquement</mat-error>
          }
          <mat-hint>URL générée : twitch.tv/{{ previewUsername() || '…' }}</mat-hint>
        </mat-form-field>

        <!-- Display name -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nom affiché (optionnel)</mat-label>
          <input matInput formControlName="displayName" placeholder="Laisser vide = pseudo" />
        </mat-form-field>

        <!-- Jeu principal -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Jeu principal (optionnel)</mat-label>
          <input matInput formControlName="gameLabel" placeholder="ex: League of Legends" />
        </mat-form-field>

        <!-- Description -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description courte (optionnel)</mat-label>
          <textarea matInput formControlName="description" rows="3" maxlength="280"
            placeholder="Max 280 caractères"></textarea>
          <mat-hint align="end">{{ descriptionLength() }} / 280</mat-hint>
        </mat-form-field>

        <!-- Joueur lié -->
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Joueur lié (optionnel)</mat-label>
          <mat-select formControlName="teamMemberId">
            <mat-option [value]="null">— aucun —</mat-option>
            @for (option of memberOptions(); track option.id) {
              <mat-option [value]="option.id">{{ option.label }}</mat-option>
            }
          </mat-select>
          @if (loadingMembers()) {
            <mat-hint>Chargement des joueurs…</mat-hint>
          }
        </mat-form-field>

        <!-- Ordre d'affichage -->
        <mat-form-field appearance="outline" class="half-width">
          <mat-label>Ordre d'affichage</mat-label>
          <input matInput formControlName="position" type="number" min="0" />
        </mat-form-field>

        <!-- Chaîne active -->
        <div class="checkbox-field">
          <mat-checkbox formControlName="isActive" color="primary">
            Chaîne active (visible sur la page En Live)
          </mat-checkbox>
        </div>

        @if (error()) {
          <div class="error-banner" role="alert">
            <mat-icon aria-hidden="true">error_outline</mat-icon>
            {{ error() }}
          </div>
        }

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button type="button" (click)="cancel()">Annuler</button>
      <button
        mat-raised-button
        color="primary"
        type="button"
        (click)="save()"
        [disabled]="form.invalid || saving()"
      >
        {{ saving() ? 'Enregistrement…' : (isEdit() ? 'Mettre à jour' : 'Créer') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: min(540px, 92vw);
      padding: 1.5rem !important;
    }

    .channel-form {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .full-width {
      width: 100%;
    }

    .half-width {
      width: 50%;
    }

    .required {
      color: var(--error, #f44336);
    }

    .checkbox-field {
      margin: 0.5rem 0 0.75rem;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid rgba(244, 67, 54, 0.3);
      border-radius: 6px;
      color: #f44336;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }
  `]
})
export class TwitchChannelDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TwitchChannelDialogComponent>);
  private readonly data = inject<TwitchChannelDialogData>(MAT_DIALOG_DATA);
  private readonly channelsService = inject(TwitchChannelsService);
  private readonly http = inject(HttpClient);

  readonly isEdit = signal<boolean>(!!this.data.channel);
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  readonly loadingMembers = signal<boolean>(false);
  readonly memberOptions = signal<TeamMemberOption[]>([]);
  readonly previewUsername = signal<string>(this.data.channel?.twitchUsername ?? '');
  readonly descriptionLength = signal<number>(
    (this.data.channel?.description ?? '').length
  );

  readonly form: FormGroup = this.fb.group({
    twitchUsername: [
      this.data.channel?.twitchUsername ?? '',
      [Validators.required, Validators.pattern(TWITCH_USERNAME_PATTERN)]
    ],
    displayName: [this.data.channel?.displayName ?? ''],
    gameLabel: [this.data.channel?.gameLabel ?? ''],
    description: [this.data.channel?.description ?? '', [Validators.maxLength(280)]],
    teamMemberId: [this.data.channel?.teamMemberId ?? null],
    position: [this.data.channel?.position ?? 0, [Validators.min(0)]],
    isActive: [this.data.channel?.isActive ?? true]
  });

  ngOnInit(): void {
    this.form.get('twitchUsername')!.valueChanges.subscribe((val: string) => {
      this.previewUsername.set(val ?? '');
    });
    this.form.get('description')!.valueChanges.subscribe((val: string) => {
      this.descriptionLength.set((val ?? '').length);
    });
    this.loadTeamMembers();
  }

  private loadTeamMembers(): void {
    this.loadingMembers.set(true);
    this.http
      .get<{ id: number; name: string; slug: string; members: TeamMember[] }[]>(
        `${environment.apiUrl}/api/admin/teams`
      )
      .subscribe({
        next: (teams) => {
          const options: TeamMemberOption[] = [];
          teams.forEach(team => {
            (team.members ?? []).forEach(member => {
              options.push({
                id: member.id,
                label: `${team.name} · ${member.role} — ${member.name}`
              });
            });
          });
          this.memberOptions.set(options);
          this.loadingMembers.set(false);
        },
        error: () => {
          // Membres non chargés, le select aura juste "— aucun —"
          this.loadingMembers.set(false);
        }
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(undefined);

    const raw = this.form.value;
    const dto: CreateTwitchChannelDto | UpdateTwitchChannelDto = {
      twitchUsername: raw.twitchUsername,
      displayName: raw.displayName || null,
      gameLabel: raw.gameLabel || null,
      description: raw.description || null,
      teamMemberId: raw.teamMemberId ?? null,
      position: Number(raw.position ?? 0),
      isActive: raw.isActive ?? true
    };

    const request$ = this.isEdit()
      ? this.channelsService.updateChannel(this.data.channel!.id, dto as UpdateTwitchChannelDto)
      : this.channelsService.createChannel(dto as CreateTwitchChannelDto);

    request$.subscribe({
      next: (result) => {
        this.saving.set(false);
        this.dialogRef.close(result);
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message ?? err?.message;
        if (typeof message === 'string' && message.toLowerCase().includes('unique')) {
          this.error.set('Ce pseudo est déjà enregistré.');
        } else if (Array.isArray(message)) {
          this.error.set(message.join(' — '));
        } else {
          this.error.set(message ?? "Erreur lors de l'enregistrement.");
        }
      }
    });
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
