import { Component, OnInit, input, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StaffService } from '../../../shared/services';
import { StaffMember, StaffCategory, CreateStaffDto, UpdateStaffDto } from '../../../shared/models';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

/**
 * Formulaire modal de création/édition d'un membre du staff
 */
@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent],
  templateUrl: './staff-form.component.html',
  styleUrls: ['./staff-form.component.scss']
})
export class StaffFormComponent implements OnInit {
  private readonly staffService = inject(StaffService);
  private readonly fb = inject(FormBuilder);

  // Inputs
  readonly member = input<StaffMember | undefined>();
  readonly category = input<StaffCategory>(StaffCategory.ADMIN);

  // Outputs
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  // Signals
  readonly saving = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);

  staffForm!: FormGroup;
  readonly StaffCategory = StaffCategory;

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Initialise le formulaire
   */
  private initForm(): void {
    const member = this.member();

    this.staffForm = this.fb.group({
      name: [member?.name || '', Validators.required],
      role: [member?.role || '', Validators.required],
      category: [member?.category || this.category(), Validators.required],
      image: [member?.image || '']
    });
  }

  /**
   * Gère l'upload d'image
   */
  onImageUploaded(url: string): void {
    this.staffForm.patchValue({ image: url });
  }

  /**
   * Gère la suppression d'image
   */
  onImageRemoved(): void {
    this.staffForm.patchValue({ image: '' });
  }

  /**
   * Sauvegarde le formulaire
   */
  save(): void {
    if (this.staffForm.invalid) {
      this.staffForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.error.set(undefined);

    const member = this.member();
    const formValue = this.staffForm.value;

    if (member) {
      // Mise à jour
      const updateDto: UpdateStaffDto = {
        name: formValue.name,
        role: formValue.role,
        category: formValue.category,
        image: formValue.image
      };

      this.staffService.updateMember(member.id, updateDto).subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set('Erreur lors de la mise à jour');
          console.error('Update error:', err);
        }
      });
    } else {
      // Création
      const createDto: CreateStaffDto = {
        name: formValue.name,
        role: formValue.role,
        category: formValue.category,
        image: formValue.image
      };

      this.staffService.createMember(createDto).subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set('Erreur lors de la création');
          console.error('Create error:', err);
        }
      });
    }
  }

  /**
   * Annule le formulaire
   */
  cancel(): void {
    this.cancelled.emit();
  }

  /**
   * Vérifie si un champ a une erreur
   */
  hasError(field: string, error: string): boolean {
    const control = this.staffForm.get(field);
    return !!(control && control.hasError(error) && control.touched);
  }

  get isEditMode(): boolean {
    return !!this.member();
  }
}
