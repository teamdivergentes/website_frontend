import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormRecord, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { RolesService } from '../../../../shared/services/api/roles.service';
import type {
  Role,
  PermissionGroup,
  CreateRoleDto,
  UpdateRoleDto,
} from '../../../../shared/models/user.model';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { FormActionsComponent } from '../../shared/form-actions.component';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ErrorStateComponent } from '../../shared/error-state.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { HasUnsavedChanges } from '../../shared/unsaved-changes.guard';
import { environment } from '../../../../environments/environment';

/** Un module de permissions et ses cases, dans l'ordre rendu par l'API. */
interface PermissionGroupControl {
  module: string;
  permissions: Array<{ key: string; control: FormControl<boolean> }>;
}

/**
 * Creation et edition d'un role.
 *
 * Ce formulaire etait un dialogue au palier `lg`. Compte au nombre de champs de
 * texte, il parait minuscule : **un seul**, le nom. Compte au nombre de
 * decisions demandees a l'administrateur, c'est l'ecran le plus dense du panel
 * — une matrice de trente-et-une permissions reparties sur onze modules.
 *
 * Le dialogue la repliait derriere onze accordeons dans un conteneur a
 * `max-height: 70vh` : impossible de voir ce qu'un role autorise sans deplier
 * un a un, ni de comparer deux modules du regard. La page rend la matrice
 * entiere, chaque module dans sa carte.
 *
 * La regle inscrite dans `frontend/CLAUDE.md` en fait une page pour deux
 * motifs sur trois : plus de huit controles, et une collection editable dans
 * l'ecran.
 */
@Component({
  selector: 'app-role-form-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    FormActionsComponent,
    PageHeaderComponent,
    ErrorStateComponent,
    SkeletonComponent,
  ],
  template: `
    <app-page-header [title]="isEdit() ? 'Modifier le rôle' : 'Nouveau rôle'">
      <button
        leading
        mat-icon-button
        class="back-button"
        aria-label="Retour aux rôles"
        (click)="cancel()"
      >
        <mat-icon>arrow_back</mat-icon>
      </button>
    </app-page-header>

    @if (loadError()) {
      <app-error-state [message]="loadError()!" [retrying]="loading()" (retry)="load()" />
    } @else if (loading()) {
      <app-skeleton variant="list" [rows]="5" />
    } @else {
      <form [formGroup]="form" class="form-page">
        <!-- ═══ Section 1 : Identité ═══ -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">01</span>
            <span class="section-label">Identité</span>
          </div>

          <mat-form-field appearance="outline">
            <mat-label>Nom du rôle</mat-label>
            <input matInput formControlName="name" placeholder="Ex: Community Manager" required />
            @if (form.controls.name.hasError('required') && form.controls.name.touched) {
              <mat-error>Le nom est requis</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- ═══ Section 2 : Permissions ═══ -->
        <div class="form-section permissions-section">
          <div class="section-header">
            <span class="section-number">02</span>
            <span class="section-label">Permissions</span>
            <span class="section-tally" data-testid="permissions-tally">
              {{ selectedTotal() }}/{{ permissionTotal() }}
            </span>
          </div>

          @if (!hasAnyPermissionSelected()) {
            <div class="validation-error" role="alert">
              <mat-icon aria-hidden="true">warning</mat-icon>
              <span>Veuillez sélectionner au moins une permission</span>
            </div>
          }

          <div class="permission-groups" formGroupName="permissions">
            @for (group of permissionGroups(); track group.module) {
              <section class="permission-group" [attr.data-module]="group.module">
                <header class="group-header">
                  <span class="group-name">{{ group.module }}</span>
                  <span class="selected-count">
                    ({{ getSelectedCount(group) }}/{{ group.permissions.length }})
                  </span>
                </header>

                <div class="group-actions">
                  <button
                    type="button"
                    mat-button
                    [attr.aria-label]="'Tout sélectionner pour ' + group.module"
                    (click)="selectAll(group)"
                  >
                    <mat-icon aria-hidden="true">check_circle</mat-icon>
                    Tout sélectionner
                  </button>
                  <button
                    type="button"
                    mat-button
                    [attr.aria-label]="'Tout désélectionner pour ' + group.module"
                    (click)="deselectAll(group)"
                  >
                    <mat-icon aria-hidden="true">cancel</mat-icon>
                    Tout désélectionner
                  </button>
                </div>

                <div class="permissions-list">
                  @for (perm of group.permissions; track perm.key) {
                    <mat-checkbox [formControlName]="perm.key">{{ perm.key }}</mat-checkbox>
                  }
                </div>
              </section>
            }
          </div>
        </div>

        @if (error()) {
          <div class="error-message" role="alert">{{ error() }}</div>
        }

        <div class="form-footer">
          <app-form-actions
            [mode]="isEdit() ? 'edit' : 'create'"
            [saving]="saving()"
            [disabled]="!isFormValid()"
            (cancelled)="cancel()"
            (submitted)="save()"
          />
        </div>
      </form>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .back-button {
      margin-right: var(--admin-space-2);
    }

    /* Formulaire en une colonne : borne de contenu du panel. */
    /* Voir _admin-tokens.scss. */
    .form-page {
      display: flex;
      flex-direction: column;
      max-width: var(--admin-page-max);

      mat-form-field {
        width: 100%;
      }
    }

    /* ── Section cards ── */
    .form-section {
      background: var(--admin-surface-veil);
      border: 1px solid var(--admin-border-panel);
      border-radius: var(--admin-radius-lg);
      padding: var(--admin-space-5) var(--admin-space-6) var(--admin-space-6);
      margin-bottom: var(--admin-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--admin-space-3);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: var(--admin-space-3);
      margin-bottom: var(--admin-space-1);
      padding-bottom: var(--admin-space-3);
      border-bottom: 1px solid var(--admin-border-panel);
    }

    .section-number {
      font-size: var(--admin-font-2xs);
      font-weight: 700;
      color: var(--admin-accent);
      background: var(--admin-accent-border);
      border: 1px solid var(--admin-accent-bg);
      border-radius: var(--admin-radius-sm);
      padding: var(--admin-space-05) var(--admin-space-2);
      letter-spacing: 0.05em;
    }

    .section-label {
      font-size: var(--admin-font-md);
      font-weight: 600;
      color: var(--admin-text);
      letter-spacing: -0.01em;
    }

    /* Total selectionne, cale a droite de l'en-tete de section. */
    .section-tally {
      margin-left: auto;
      font-size: var(--admin-font-sm);
      font-weight: 600;
      color: var(--admin-accent);
    }

    /* ── Bandeau "au moins une permission" ── */
    .validation-error {
      display: flex;
      align-items: center;
      gap: var(--admin-space-2);
      padding: var(--admin-space-3);
      background: var(--admin-danger-bg);
      border: 1px solid var(--admin-danger-border);
      border-radius: var(--admin-radius-xs);
      color: var(--admin-danger);

      mat-icon {
        font-size: 1.25rem;
        width: 1.25rem;
        height: 1.25rem;
      }
    }

    /* ── Matrice ── */
    /* Le dialogue repliait chaque module derriere un accordeon : c'etait une */
    /* reponse a la hauteur de la modale, pas un choix de lecture. La page les */
    /* pose cote a cote, tous ouverts. */
    .permission-groups {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--admin-space-3);
    }

    .permission-group {
      display: flex;
      flex-direction: column;
      gap: var(--admin-space-2);
      padding: var(--admin-space-3) var(--admin-space-4) var(--admin-space-4);
      background: var(--admin-surface);
      border: 1px solid var(--admin-border-panel);
      border-radius: var(--admin-radius-sm);
    }

    .group-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: var(--admin-space-2);

      .group-name {
        font-size: var(--admin-font-md);
        font-weight: 600;
        color: var(--admin-text);
      }

      .selected-count {
        color: var(--admin-accent);
        font-size: var(--admin-font-sm);
        font-weight: 500;
      }
    }

    .group-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--admin-space-1);
      padding-bottom: var(--admin-space-2);
      border-bottom: 1px solid var(--admin-border-panel);

      button {
        color: var(--admin-text-dim);
        font-size: var(--admin-font-xs);

        mat-icon {
          font-size: 1.125rem;
          width: 1.125rem;
          height: 1.125rem;
          margin-right: 0.25rem;
        }
      }
    }

    .permissions-list {
      display: flex;
      flex-direction: column;
      gap: var(--admin-space-2);
    }

    /* ── Erreur d'enregistrement ── */
    .error-message {
      padding: var(--admin-space-3) var(--admin-space-4);
      background: var(--admin-danger-bg-subtle);
      border: 1px solid var(--admin-danger-border);
      border-radius: var(--admin-radius-sm);
      color: var(--admin-danger);
      font-size: var(--admin-font-md);
      font-weight: 500;
      margin-bottom: var(--admin-space-4);
    }

    /* ── Pied d'action ── */
    /* La matrice est longue : sans position collante, enregistrer demanderait */
    /* de remonter jusqu'en bas de page apres chaque case cochee. */
    .form-footer {
      position: sticky;
      bottom: 0;
      display: flex;
      justify-content: flex-end;
      padding: var(--admin-space-3) 0;
      background: var(--admin-surface);
      border-top: 1px solid var(--admin-border);
    }

    @media (max-width: 599px) {
      .permission-groups {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RoleFormPageComponent implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifier = inject(AdminNotifier);
  private readonly rolesService = inject(RolesService);

  /**
   * Les cases de la matrice vivent **dans** le formulaire reactif, sous un
   * `FormRecord`.
   *
   * Le dialogue les tenait a cote, dans un signal de `FormControl` isoles.
   * Aucun parent ne recevait donc leur etat `dirty`, et un `form.dirty` aurait
   * declare "aucune modification" a un administrateur qui venait de cocher
   * trente permissions. Les rattacher au groupe suffit a rendre `form.dirty`
   * suffisant ici — pas besoin d'un second terme dans `hasUnsavedChanges()`
   * comme sur les pages d'equipe.
   */
  readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    permissions: new FormRecord<FormControl<boolean>>({}),
  });

  readonly isEdit = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  /** Echec du chargement, distinct d'un echec d'enregistrement. */
  readonly loadError = signal<string | undefined>(undefined);
  readonly permissionGroups = signal<PermissionGroupControl[]>([]);

  readonly permissionTotal = computed(() =>
    this.permissionGroups().reduce((sum, group) => sum + group.permissions.length, 0),
  );

  private roleId: number | null = null;
  /** Passe a vrai le temps de la navigation qui suit un enregistrement reussi. */
  private saved = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.roleId = Number(id);
      this.isEdit.set(true);
    }
    this.load();
  }

  /**
   * Charge la matrice de permissions et, en edition, le role a modifier.
   *
   * Les deux requetes sont liees : une matrice sans le role afficherait des
   * cases toutes decochees, et le premier enregistrement retirerait alors
   * silencieusement toutes les permissions du role. Un echec de l'une bloque
   * donc la page.
   *
   * Le dialogue n'avait **aucun** gestionnaire d'erreur sur le chargement des
   * permissions : une panne rendait une matrice vide, avec pour seul indice le
   * message "Veuillez selectionner au moins une permission" — qui accusait
   * l'administrateur d'une panne d'API.
   */
  load(): void {
    this.loading.set(true);
    this.loadError.set(undefined);

    forkJoin({
      groups: this.rolesService.getPermissions(),
      role: this.roleId === null ? of(null) : this.rolesService.getRole(this.roleId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ groups, role }) => {
          this.buildMatrix(groups, role);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.loadError.set(
            this.roleId === null
              ? 'Impossible de charger les permissions.'
              : 'Impossible de charger ce rôle.',
          );
          if (!environment.production) console.error('Load role error:', err);
        },
      });
  }

  /**
   * (Re)construit la matrice. Appele aussi apres un reessai : les controles
   * precedents sont retires, sinon un module disparu de l'API laisserait sa
   * permission dans le DTO enregistre.
   */
  private buildMatrix(groups: PermissionGroup[], role: Role | null): void {
    const record = this.form.controls.permissions;
    for (const key of Object.keys(record.controls)) {
      record.removeControl(key);
    }

    const granted = role?.permissions ?? [];

    const built: PermissionGroupControl[] = groups.map((group) => ({
      module: group.module,
      permissions: group.permissions.map((key) => {
        const control = new FormControl<boolean>(granted.includes(key), { nonNullable: true });
        record.addControl(key, control);
        return { key, control };
      }),
    }));

    this.permissionGroups.set(built);
    this.form.controls.name.setValue(role?.name ?? '');
    this.form.markAsPristine();
  }

  /** Coche toutes les permissions d'un module. */
  selectAll(group: PermissionGroupControl): void {
    this.setGroup(group, true);
  }

  /** Decoche toutes les permissions d'un module. */
  deselectAll(group: PermissionGroupControl): void {
    this.setGroup(group, false);
  }

  /**
   * `setValue` ne marque pas un controle comme modifie — seule une saisie de
   * l'utilisateur le fait. Sans le `markAsDirty` explicite, cocher un module
   * entier puis quitter la page ne declencherait aucune confirmation.
   */
  private setGroup(group: PermissionGroupControl, value: boolean): void {
    group.permissions.forEach((perm) => perm.control.setValue(value));
    this.form.markAsDirty();
  }

  /** Nombre de permissions cochees dans un module. */
  getSelectedCount(group: PermissionGroupControl): number {
    return group.permissions.filter((perm) => perm.control.value).length;
  }

  /** Nombre de permissions cochees, tous modules confondus. */
  selectedTotal(): number {
    return this.permissionGroups().reduce((sum, group) => sum + this.getSelectedCount(group), 0);
  }

  /** Un role sans aucune permission n'autorise rien : le refuser vaut mieux que le creer. */
  hasAnyPermissionSelected(): boolean {
    return this.selectedTotal() > 0;
  }

  isFormValid(): boolean {
    return this.form.valid && this.hasAnyPermissionSelected();
  }

  /** Permissions cochees, dans l'ordre des modules rendu par l'API. */
  private getSelectedPermissions(): string[] {
    return this.permissionGroups().flatMap((group) =>
      group.permissions.filter((perm) => perm.control.value).map((perm) => perm.key),
    );
  }

  save(): void {
    if (!this.isFormValid()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(undefined);

    const name = this.form.controls.name.value;
    const permissions = this.getSelectedPermissions();

    const updateDto: UpdateRoleDto = { name, permissions };
    const createDto: CreateRoleDto = { name, permissions };

    const request$ = this.isEdit()
      ? this.rolesService.updateRole(this.roleId!, updateDto)
      : this.rolesService.createRole(createDto);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.notifier.saved('Rôle', this.isEdit() ? 'edit' : 'create');
        this.saved = true;
        this.backToList();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set("Erreur lors de l'enregistrement");
        if (!environment.production) console.error('Save role error:', err);
      },
    });
  }

  cancel(): void {
    this.backToList();
  }

  /** Contrat de `unsavedChangesGuard`. */
  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saved;
  }

  private backToList(): void {
    void this.router.navigate(['/admin/roles']);
  }
}
