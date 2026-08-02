import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { ImageUploadComponent } from '../../../../../../shared/components/image-upload/image-upload.component';
import { TeamMember, CreateMemberDto } from '../../../../../../shared/models';
import { hasSocialLinks, socialLinkCount, buildEmptyFormValues } from '../../utils/team-member-validators';
import { AdminValidators } from '../../../../../shared/admin-validators';

export interface MemberSaveEvent {
  data: CreateMemberDto;
  editingMember?: TeamMember;
}

/**
 * Formulaire d'ajout ou d'édition d'un membre d'équipe.
 * Communique vers le parent via outputs (save, cancel).
 */
@Component({
  selector: 'app-team-member-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatExpansionModule,
    ImageUploadComponent
  ],
  templateUrl: './team-member-form.component.html',
  styleUrl: './team-member-form.component.scss'
})
export class TeamMemberFormComponent {
  private readonly fb = inject(FormBuilder);

  /** Membre en cours d'édition — undefined = mode ajout */
  readonly editingMember = input<TeamMember | undefined>(undefined);

  /** Indique que la sauvegarde est en cours (spinner) */
  readonly saving = input<boolean>(false);

  /** Message d'erreur à afficher */
  readonly error = input<string | undefined>(undefined);

  /** Émis quand l'utilisateur clique Sauvegarder */
  readonly memberSaved = output<MemberSaveEvent>();

  /** Émis quand l'utilisateur annule l'édition */
  readonly editCancelled = output<void>();

  readonly form: FormGroup;

  readonly hasSocialLinks = signal<boolean>(false);
  readonly socialCount = signal<number>(0);
  readonly isEditMode = computed(() => !!this.editingMember());

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      realName: [''],
      role: ['', Validators.required],
      image: [''],
      nationality: [''],
      birthDate: [''],
      biography: [''],
      // Les memes champs sont validees dans coaching-staff-dialog : ils ne
      // l'etaient pas ici, alors qu'ils alimentent les memes liens publics.
      twitter: ['', AdminValidators.url()],
      twitch: ['', AdminValidators.url()],
      instagram: ['', AdminValidators.url()],
      youtube: ['', AdminValidators.url()]
    });

    // Synchronise le formulaire quand editingMember change
    effect(() => {
      const member = this.editingMember();
      if (member) {
        this.form.patchValue({
          name: member.name,
          realName: member.realName ?? '',
          role: member.role,
          image: member.image ?? '',
          nationality: member.nationality ?? '',
          birthDate: member.birthDate ?? '',
          biography: member.biography ?? '',
          twitter: member.socials?.twitter ?? '',
          twitch: member.socials?.twitch ?? '',
          instagram: member.socials?.instagram ?? '',
          youtube: member.socials?.youtube ?? ''
        });
      } else {
        this.form.reset(buildEmptyFormValues());
      }
      this._refreshSocialSignals();
    });
  }

  onSubmit(): void {
    if (!this.form.valid) {
      // Sans cela, cliquer sur Enregistrer sur un formulaire invalide ne
      // produisait aucun retour visible.
      this.form.markAllAsTouched();
      return;
    }

    const formValue = this.form.value;
    const isEditing = this.isEditMode();
    const clearValue = isEditing ? null : undefined;

    const memberData: CreateMemberDto = {
      name: formValue.name,
      realName: formValue.realName || clearValue,
      role: formValue.role,
      image: formValue.image || clearValue,
      nationality: formValue.nationality || clearValue,
      birthDate: formValue.birthDate || clearValue,
      biography: formValue.biography || clearValue,
      socials: {
        twitter: formValue.twitter || clearValue,
        twitch: formValue.twitch || clearValue,
        instagram: formValue.instagram || clearValue,
        youtube: formValue.youtube || clearValue
      }
    };

    this.memberSaved.emit({ data: memberData, editingMember: this.editingMember() });
  }

  onCancel(): void {
    this.editCancelled.emit();
  }

  /**
   * Vide le formulaire et le remet a l'etat intact.
   *
   * Appele par la page apres un enregistrement reussi. L'effet de
   * synchronisation ne peut pas s'en charger en mode ajout : `editingMember`
   * y vaut deja `undefined` avant comme apres, donc il ne se rejoue pas. La
   * saisie deja enregistree restait alors a l'ecran, et la garde de sortie la
   * prenait pour un travail en cours.
   */
  resetForm(): void {
    this.form.reset(buildEmptyFormValues());
    this._refreshSocialSignals();
  }

  onImageUploaded(url: string): void {
    this.form.patchValue({ image: url });
  }

  onImageRemoved(): void {
    this.form.patchValue({ image: '' });
  }

  onSocialChange(): void {
    this._refreshSocialSignals();
  }

  private _refreshSocialSignals(): void {
    const v = this.form.value;
    this.hasSocialLinks.set(hasSocialLinks(v));
    this.socialCount.set(socialLinkCount(v));
  }
}
