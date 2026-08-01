import { Component, inject, signal, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SponsorsService } from '../../../shared/services/sponsors.service';
import { Sponsor, SponsorImage } from '../../../shared/models';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { AdminConfirmService } from '../../shared/admin-confirm.service';

interface DialogData {
  sponsor: Sponsor;
}

/**
 * Dialog pour gérer les 3 images d'un sponsor:
 * - 1 image principale (logo)
 * - 2 images secondaires (positionnées selon le layout choisi)
 */
@Component({
  selector: 'app-sponsor-images-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ImageUploadComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Images de {{ data.sponsor.name }}</h2>

    <mat-dialog-content>
      <p class="info-text">
        Chaque sponsor possède 3 images : 1 image principale (logo) et 2 images secondaires.
        Les images secondaires seront positionnées selon le layout choisi dans le formulaire du sponsor.
      </p>

      <!-- Image Principale -->
      <div class="image-section">
        <h3>
          <mat-icon>star</mat-icon>
          Image Principale (Logo)
        </h3>
        <div class="image-slot">
          @if (primaryImage()) {
            <div class="current-image">
              <img [src]="primaryImage()!.url" [alt]="primaryImage()!.alt || 'Image principale'" />
              <div class="image-overlay">
                <button mat-icon-button
                        color="warn"
                        matTooltip="Supprimer"
                        (click)="removeImage(primaryImage()!)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          } @else {
            <app-image-upload
              description="Logo principal du sponsor."
              (imageUploaded)="onImageUploaded($event, 'primary')"
            />
          }
        </div>
      </div>

      <!-- Image Secondaire 1 -->
      <div class="image-section">
        <h3>
          <mat-icon>image</mat-icon>
          Image Secondaire 1
        </h3>
        <div class="image-slot">
          @if (secondaryImage1()) {
            <div class="current-image">
              <img [src]="secondaryImage1()!.url" [alt]="secondaryImage1()!.alt || 'Image secondaire 1'" />
              <div class="image-overlay">
                <button mat-icon-button
                        color="warn"
                        matTooltip="Supprimer"
                        (click)="removeImage(secondaryImage1()!)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          } @else {
            <app-image-upload
              description="Image secondaire du sponsor."
              (imageUploaded)="onImageUploaded($event, 'secondary1')"
            />
          }
        </div>
      </div>

      <!-- Image Secondaire 2 -->
      <div class="image-section">
        <h3>
          <mat-icon>image</mat-icon>
          Image Secondaire 2
        </h3>
        <div class="image-slot">
          @if (secondaryImage2()) {
            <div class="current-image">
              <img [src]="secondaryImage2()!.url" [alt]="secondaryImage2()!.alt || 'Image secondaire 2'" />
              <div class="image-overlay">
                <button mat-icon-button
                        color="warn"
                        matTooltip="Supprimer"
                        (click)="removeImage(secondaryImage2()!)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          } @else {
            <app-image-upload
              description="Image secondaire du sponsor."
              (imageUploaded)="onImageUploaded($event, 'secondary2')"
            />
          }
        </div>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="true">Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      min-width: min(550px, 90vw);
      max-height: 80vh;
      overflow-y: auto;
    }

    .info-text {
      color: var(--admin-text-dim);
      font-size: var(--admin-font-md);
      margin: 0 0 1.5rem 0;
      padding: var(--admin-space-4);
      background: var(--admin-surface);
      border-radius: var(--admin-radius-sm);
      border-left: 3px solid var(--admin-accent);
    }

    .image-section {
      margin-bottom: 2rem;

      h3 {
        display: flex;
        align-items: center;
        gap: var(--admin-space-2);
        margin: 0 0 1rem 0;
        color: var(--admin-text);
        font-size: var(--admin-font-lg);
        font-weight: 500;

        mat-icon {
          color: var(--admin-accent);
          font-size: 1.25rem;
          width: 1.25rem;
          height: 1.25rem;
        }
      }
    }

    .image-slot {
      min-height: 200px;
    }

    .current-image {
      position: relative;
      display: inline-block;
      border: 2px solid var(--admin-accent);
      border-radius: var(--admin-radius-lg);
      overflow: hidden;
      background: var(--admin-surface);

      img {
        max-width: 300px;
        max-height: 200px;
        object-fit: contain;
        display: block;
        padding: var(--admin-space-4);
      }

      .image-overlay {
        position: absolute;
        top: 0;
        right: 0;
        padding: var(--admin-space-2);
        background: var(--admin-scrim);
        border-radius: 0 0 0 8px;
        opacity: 0;
        transition: opacity 0.2s;
      }

      &:hover .image-overlay {
        opacity: 1;
      }
    }

    app-image-upload {
      display: block;
      max-width: 400px;
    }
  `]
})
export class SponsorImagesDialogComponent {
  private readonly sponsorsService = inject(SponsorsService);
  private readonly dialogRef = inject(MatDialogRef<SponsorImagesDialogComponent>);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(AdminConfirmService);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<DialogData>(MAT_DIALOG_DATA);

  readonly loading = signal(false);
  readonly images = signal<SponsorImage[]>([...this.data.sponsor.images].sort((a, b) => a.position - b.position));

  // Image principale (isPrimary = true ou position 0)
  readonly primaryImage = computed(() => {
    const imgs = this.images();
    return imgs.find(i => i.isPrimary) || imgs.find(i => i.position === 0) || null;
  });

  // Image secondaire 1 (position 1)
  readonly secondaryImage1 = computed(() => {
    const imgs = this.images();
    const primary = this.primaryImage();
    const nonPrimary = imgs.filter(i => i.id !== primary?.id);
    return nonPrimary.find(i => i.position === 1) || nonPrimary[0] || null;
  });

  // Image secondaire 2 (position 2)
  readonly secondaryImage2 = computed(() => {
    const imgs = this.images();
    const primary = this.primaryImage();
    const secondary1 = this.secondaryImage1();
    const remaining = imgs.filter(i => i.id !== primary?.id && i.id !== secondary1?.id);
    return remaining.find(i => i.position === 2) || remaining[0] || null;
  });

  /**
   * Gère l'upload d'une nouvelle image
   */
  onImageUploaded(url: string, slot: 'primary' | 'secondary1' | 'secondary2'): void {
    this.loading.set(true);

    const position = slot === 'primary' ? 0 : slot === 'secondary1' ? 1 : 2;
    const isPrimary = slot === 'primary';

    const dto = {
      url,
      alt: `${this.data.sponsor.name} - ${slot === 'primary' ? 'Logo' : 'Image'}`,
      isPrimary
    };

    this.sponsorsService.addImage(this.data.sponsor.id, dto).subscribe({
      next: (newImage) => {
        // Mettre à jour la position
        this.sponsorsService.reorderImages(
          this.data.sponsor.id,
          this.getNewOrder(newImage as SponsorImage, position)
        ).subscribe({
          next: () => {
            this.loading.set(false);
            this.reloadImages();
          },
          error: () => {
            this.loading.set(false);
            this.reloadImages();
          }
        });
      },
      error: (err) => {
        console.error('Add image error:', err);
        this.loading.set(false);
        this.snackBar.open('Erreur lors de l\'ajout de l\'image', 'Fermer', { duration: 5000 });
      }
    });
  }

  /**
   * Recharge les images du sponsor depuis l'API
   */
  private reloadImages(): void {
    this.sponsorsService.getSponsorBySlug(this.data.sponsor.slug).subscribe({
      next: (sponsor) => {
        this.images.set([...sponsor.images].sort((a, b) => a.position - b.position));
      }
    });
  }

  /**
   * Calcule le nouvel ordre des images
   */
  private getNewOrder(newImage: SponsorImage, targetPosition: number): number[] {
    const currentImages = [...this.images()];
    const allImages = [...currentImages, newImage];

    // Trier par position souhaitée
    return allImages
      .sort((a, b) => {
        if (a.id === newImage.id) return targetPosition - b.position;
        if (b.id === newImage.id) return a.position - targetPosition;
        return a.position - b.position;
      })
      .map(img => img.id);
  }

  /**
   * Supprime une image
   */
  removeImage(image: SponsorImage): void {
    this.confirm.delete('cette image').subscribe(confirmed => {
      if (!confirmed) return;

      this.sponsorsService.removeImage(this.data.sponsor.id, image.id).subscribe({
        next: () => {
          this.reloadImages();
        },
        error: (err) => {
          console.error('Remove image error:', err);
          this.snackBar.open('Erreur lors de la suppression', 'Fermer', { duration: 5000 });
        }
      });
    });
  }
}
