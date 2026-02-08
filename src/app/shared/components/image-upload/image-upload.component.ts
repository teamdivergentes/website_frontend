import { Component, input, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadService } from '../../services';

/**
 * Composant de upload d'image avec drag & drop
 *
 * @example
 * <app-image-upload
 *   [currentImage]="member.photo"
 *   (imageUploaded)="onImageUploaded($event)"
 *   (imageRemoved)="onImageRemoved()"
 * />
 */
@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent {
  private readonly uploadService = inject(UploadService);

  // Inputs
  readonly currentImage = input<string | undefined>();
  readonly accept = input<string>('image/*');
  readonly maxSizeMB = input<number>(5);

  // Outputs
  readonly imageUploaded = output<string>();
  readonly imageRemoved = output<void>();

  // Signals pour l'état local
  readonly preview = signal<string | undefined>(undefined);
  readonly uploading = signal<boolean>(false);
  readonly progress = signal<number>(0);
  readonly isDragging = signal<boolean>(false);
  readonly error = signal<string | undefined>(undefined);

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
  }

  /**
   * Traite le fichier sélectionné
   */
  private handleFile(file: File): void {
    this.error.set(undefined);

    // Validation du type
    if (!file.type.startsWith('image/')) {
      this.error.set('Le fichier doit être une image');
      return;
    }

    // Validation de la taille
    const maxSizeBytes = this.maxSizeMB() * 1024 * 1024;
    const maxSizeMBValue = this.maxSizeMB();
    if (file.size > maxSizeBytes) {
      this.error.set('La taille maximale est de ' + maxSizeMBValue + 'MB');
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
          this.imageUploaded.emit(event.url);
        }
      },
      error: (err) => {
        this.uploading.set(false);
        this.progress.set(0);
        this.preview.set(undefined);
        this.error.set('Erreur lors de l\'upload de l\'image');
        console.error('Upload error:', err);
      }
    });
  }

  /**
   * Supprime l'image actuelle
   */
  removeImage(): void {
    const imageUrl = this.currentImage();
    if (imageUrl) {
      this.uploadService.deleteImage(imageUrl).subscribe({
        next: () => {
          this.preview.set(undefined);
          this.imageRemoved.emit();
        },
        error: (err) => {
          this.error.set('Erreur lors de la suppression de l\'image');
          console.error('Delete error:', err);
        }
      });
    } else {
      this.preview.set(undefined);
      this.imageRemoved.emit();
    }
  }

  /**
   * Récupère l'URL de l'image à afficher
   */
  get displayImage(): string | undefined {
    return this.preview() || this.currentImage();
  }
}
