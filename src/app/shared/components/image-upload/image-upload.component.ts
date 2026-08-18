import { Component, computed, input, output, signal, inject, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UploadService } from '../../services';

/**
 * Composant de upload d'image avec drag & drop
 *
 * @example
 * <app-image-upload
 *   [currentImage]="member.photo"
 *   description="Photo de profil du membre. Un format carré est recommandé."
 *   (imageUploaded)="onImageUploaded($event)"
 *   (imageRemoved)="onImageRemoved()"
 * />
 */
/**
 * Compteur d'instances, pour donner a chaque champ fichier un identifiant qui
 * lui soit propre. Plusieurs `app-image-upload` cohabitent sur un meme ecran —
 * l'editeur d'article, la page de configuration — et un identifiant fixe ferait
 * pointer tous les libelles vers le premier champ.
 *
 * Aucun risque de desynchronisation au rendu serveur : les routes `/admin/**`
 * sont exclues du SSR, et ce composant n'existe que la.
 */
let nextImageUploadId = 0;

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent {
  private readonly uploadService = inject(UploadService);
  private readonly snackBar = inject(MatSnackBar);

  // Inputs
  readonly currentImage = input<string | undefined>();
  readonly accept = input<string>('image/*');
  readonly maxSizeMB = input<number>(5);
  readonly description = input<string | undefined>();

  /**
   * Identifiant du champ fichier, pour l'associer a son libelle. Le champ est
   * masque et declenche par le bouton visible, mais il reste un controle de
   * formulaire : sans libelle associe, il est annonce sans nom.
   */
  readonly inputId = `image-upload-${++nextImageUploadId}`;

  // Outputs
  readonly imageUploaded = output<string>();
  readonly imageRemoved = output<void>();

  // Signals pour l'état local
  readonly preview = signal<string | undefined>(undefined);
  readonly uploading = signal<boolean>(false);
  readonly progress = signal<number>(0);
  readonly isDragging = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);
  private readonly pendingUploadUrl = signal<string | undefined>(undefined);

  // Computed signal pour l'image à afficher
  readonly displayImage = computed(() => this.preview() || this.currentImage());

  constructor() {
    // Réinitialiser le preview quand currentImage change (ex: changement de membre en édition)
    effect(() => {
      this.currentImage();
      untracked(() => {
        this.preview.set(undefined);
        this.pendingUploadUrl.set(undefined);
      });
    });
  }

  /**
   * Gère le drag over
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  /**
   * Gère le drag leave
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  /**
   * Gère le drop de fichier
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  /**
   * Gère la sélection de fichier via input
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
    // Réinitialiser l'input pour permettre de re-sélectionner le même fichier
    input.value = '';
  }

  /**
   * Traite le fichier sélectionné
   */
  private handleFile(file: File): void {
    this.error.set(undefined);

    // Validation du type
    if (!file.type.startsWith('image/')) {
      const msg = 'Le fichier doit être une image';
      this.error.set(msg);
      this.snackBar.open(msg, 'Fermer', { duration: 5000, panelClass: ['snackbar-error'] });
      return;
    }

    // Validation de la taille
    const maxSizeBytes = this.maxSizeMB() * 1024 * 1024;
    const maxSizeMBValue = this.maxSizeMB();
    if (file.size > maxSizeBytes) {
      const msg = `Fichier trop volumineux (max ${maxSizeMBValue} MB)`;
      this.error.set(msg);
      this.snackBar.open(msg, 'Fermer', { duration: 5000, panelClass: ['snackbar-error'] });
      return;
    }

    // Preview local - utiliser createObjectURL pour les SVG (plus fiable)
    if (file.type === 'image/svg+xml') {
      this.preview.set(URL.createObjectURL(file));
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.preview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }

    // Upload
    this.uploadImage(file);
  }

  /**
   * Upload l'image vers le serveur
   */
  private uploadImage(file: File): void {
    this.uploading.set(true);
    this.progress.set(0);

    this.uploadService.uploadImage(file).subscribe({
      next: (event) => {
        this.progress.set(event.progress);
        if (event.url) {
          this.uploading.set(false);
          this.pendingUploadUrl.set(event.url);
          this.imageUploaded.emit(event.url);
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.progress.set(0);
        this.preview.set(undefined);

        // Parse backend error message
        let errorMessage = 'Erreur lors de l\'upload';
        if (err instanceof HttpErrorResponse) {
          if (err.status === 413) {
            errorMessage = 'Fichier trop volumineux (max 5 MB)';
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          }
        }

        this.error.set(errorMessage);
        this.snackBar.open(errorMessage, 'Fermer', {
          duration: 5000,
          panelClass: ['snackbar-error']
        });
        console.error('Upload error:', err);
      }
    });
  }

  /**
   * Supprime l'image actuelle
   */
  removeImage(): void {
    const imageUrl = this.currentImage();
    const pendingUrl = this.pendingUploadUrl();
    const urlToDelete = imageUrl || pendingUrl;

    if (urlToDelete) {
      this.uploadService.deleteImage(urlToDelete).subscribe({
        next: () => {
          this.preview.set(undefined);
          this.pendingUploadUrl.set(undefined);
          this.imageRemoved.emit();
        },
        error: () => {
          this.preview.set(undefined);
          this.pendingUploadUrl.set(undefined);
          this.imageRemoved.emit();
        }
      });
    } else {
      this.preview.set(undefined);
      this.pendingUploadUrl.set(undefined);
      this.imageRemoved.emit();
    }
  }
}
