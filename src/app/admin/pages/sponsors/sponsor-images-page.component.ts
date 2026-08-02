import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  OnInit,
  signal,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SponsorsService } from '../../../shared/services/sponsors.service';
import { Sponsor, SponsorImage } from '../../../shared/models';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { PageHeaderComponent } from '../../shared/page-header.component';
import { ErrorStateComponent } from '../../shared/error-state.component';
import { SkeletonComponent } from '../../shared/skeleton.component';
import { HasUnsavedChanges } from '../../shared/unsaved-changes.guard';
import { environment } from '../../../../environments/environment';

/** Les trois emplacements d'images d'un sponsor, dans l'ordre d'affichage. */
export type SponsorImageSlotKey = 'primary' | 'secondary1' | 'secondary2';

/** Un emplacement rendu par la page : sa description et l'image qui l'occupe. */
interface SponsorImageSlot {
  key: SponsorImageSlotKey;
  /** Position persistee cote API pour cet emplacement. */
  position: number;
  title: string;
  icon: string;
  /** Aide affichee dans la zone de televersement quand l'emplacement est vide. */
  description: string;
  /** Texte alternatif de secours, quand l'image n'en porte pas. */
  fallbackAlt: string;
  image: SponsorImage | null;
}

/**
 * Gestion des trois images d'un sponsor : le logo principal et deux images
 * secondaires, positionnees selon le layout choisi sur la fiche du sponsor.
 *
 * C'etait un dialogue au palier `lg`. Il ne portait aucun formulaire — donc
 * aucun bouton d'enregistrement, seulement un « Fermer » — mais bien une
 * **collection editable**, ce que la troisieme condition de la regle inscrite
 * dans `frontend/CLAUDE.md` interdit a un dialogue. C'est le pattern hybride
 * liste + formulaire qui a produit les cinq « Fermer » releves par l'audit.
 *
 * Le patron est celui des jumeaux `teams` : l'identifiant vient de l'URL, un
 * identifiant inconnu rend un etat d'erreur reessayable, l'en-tete porte un
 * bouton de retour, et la sortie est gardee.
 *
 * **Ce que la garde protege ici est particulier.** La page n'a pas de
 * formulaire : chaque image est persistee des sa selection, il n'existe donc
 * pas de brouillon a perdre. Ce qui se perd, c'est un televersement **en
 * cours** — le fichier est deja parti vers le serveur mais pas encore rattache
 * au sponsor. Quitter a cet instant laisse un fichier orphelin et aucune image
 * sur la fiche. Voir `hasUnsavedChanges()`.
 */
@Component({
  selector: 'app-sponsor-images-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    ImageUploadComponent,
    PageHeaderComponent,
    ErrorStateComponent,
    SkeletonComponent,
  ],
  template: `
    <app-page-header [title]="title()" [subtitle]="subtitle()">
      <button
        leading
        mat-icon-button
        class="back-button"
        type="button"
        aria-label="Retour aux sponsors"
        (click)="backToSponsors()"
      >
        <mat-icon aria-hidden="true">arrow_back</mat-icon>
      </button>
    </app-page-header>

    @if (loadError()) {
      <app-error-state [message]="loadError()!" [retrying]="loading()" (retry)="loadSponsor()" />
    } @else if (loading()) {
      <app-skeleton variant="list" [rows]="3" [hasThumb]="true" />
    } @else {
      <div class="images-layout">
        <p class="info-text">
          Chaque sponsor possède 3 images : 1 image principale (logo) et 2 images secondaires.
          Les images secondaires sont positionnées selon le layout choisi dans le formulaire du
          sponsor.
        </p>

        @for (slot of slots(); track slot.key) {
          <section class="image-section" [attr.data-slot]="slot.key">
            <h2>
              <mat-icon aria-hidden="true">{{ slot.icon }}</mat-icon>
              {{ slot.title }}
            </h2>

            <div class="image-slot">
              @if (slot.image; as image) {
                <div class="current-image">
                  <img [src]="image.url" [alt]="image.alt || slot.fallbackAlt" />
                  <div class="image-overlay">
                    <button
                      mat-icon-button
                      type="button"
                      color="warn"
                      [attr.aria-label]="'Supprimer ' + slot.title"
                      matTooltip="Supprimer"
                      (click)="removeImage(image)"
                    >
                      <mat-icon aria-hidden="true">delete</mat-icon>
                    </button>
                  </div>
                </div>
              } @else {
                <app-image-upload
                  [description]="slot.description"
                  (imageUploaded)="onImageUploaded($event, slot.key)"
                />
              }
            </div>
          </section>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: block;
    }

    .back-button {
      margin-right: var(--admin-space-2);
    }

    /* Le dialogue imposait une largeur minimale de 550px et son propre
       defilement sur 80vh de hauteur. En page, c'est le document qui defile ;
       seule reste une borne de lisibilite. */
    .images-layout {
      max-width: 900px;
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

      h2 {
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

      &:hover .image-overlay,
      &:focus-within .image-overlay {
        opacity: 1;
      }
    }

    app-image-upload {
      display: block;
      max-width: 400px;
    }
  `],
})
export class SponsorImagesPageComponent implements OnInit, HasUnsavedChanges {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sponsorsService = inject(SponsorsService);
  private readonly confirm = inject(AdminConfirmService);
  private readonly notifier = inject(AdminNotifier);

  /**
   * Zones de televersement montees a l'instant : une par emplacement libre.
   * Leur signal `uploading` est le seul endroit ou vit l'etat « fichier parti,
   * pas encore rattache », que la garde de sortie doit connaitre.
   */
  private readonly uploads = viewChildren(ImageUploadComponent);

  /** Identifiant porte par l'URL, ce qui rend la page partageable. */
  private readonly sponsorId = Number(this.route.snapshot.paramMap.get('id'));

  readonly sponsor = signal<Sponsor | undefined>(undefined);
  readonly images = signal<SponsorImage[]>([]);
  readonly loading = signal<boolean>(false);
  /** Mutation en cours : ajout ou suppression d'une image. */
  readonly saving = signal<boolean>(false);
  /** Echec de resolution du sponsor : bloquant, la page n'a alors rien a montrer. */
  readonly loadError = signal<string | undefined>(undefined);

  /** Le nom du sponsor est la seule chose qui dit ou l'on est sur une URL partagee. */
  readonly title = computed(() => {
    const sponsor = this.sponsor();
    return sponsor ? `Images de ${sponsor.name}` : 'Images du sponsor';
  });

  readonly subtitle = computed(() => this.sponsor()?.description ?? '');

  /** Image principale : `isPrimary`, a defaut la position 0. */
  readonly primaryImage = computed(() => {
    const imgs = this.images();
    return imgs.find((i) => i.isPrimary) ?? imgs.find((i) => i.position === 0) ?? null;
  });

  /** Premiere image secondaire : position 1 parmi les non-principales. */
  readonly secondaryImage1 = computed(() => {
    const primary = this.primaryImage();
    const nonPrimary = this.images().filter((i) => i.id !== primary?.id);
    return nonPrimary.find((i) => i.position === 1) ?? nonPrimary[0] ?? null;
  });

  /** Seconde image secondaire : ce qui reste. */
  readonly secondaryImage2 = computed(() => {
    const primary = this.primaryImage();
    const secondary1 = this.secondaryImage1();
    const remaining = this.images().filter(
      (i) => i.id !== primary?.id && i.id !== secondary1?.id,
    );
    return remaining.find((i) => i.position === 2) ?? remaining[0] ?? null;
  });

  /**
   * Les trois emplacements, decrits une fois.
   *
   * Le dialogue recopiait le meme bloc de markup trois fois, a l'icone et au
   * libelle pres — soit trois endroits ou corriger la moindre evolution.
   */
  readonly slots = computed<SponsorImageSlot[]>(() => [
    {
      key: 'primary',
      position: 0,
      title: 'Image principale (logo)',
      icon: 'star',
      description: 'Logo principal du sponsor.',
      fallbackAlt: 'Image principale',
      image: this.primaryImage(),
    },
    {
      key: 'secondary1',
      position: 1,
      title: 'Image secondaire 1',
      icon: 'image',
      description: 'Image secondaire du sponsor.',
      fallbackAlt: 'Image secondaire 1',
      image: this.secondaryImage1(),
    },
    {
      key: 'secondary2',
      position: 2,
      title: 'Image secondaire 2',
      icon: 'image',
      description: 'Image secondaire du sponsor.',
      fallbackAlt: 'Image secondaire 2',
      image: this.secondaryImage2(),
    },
  ]);

  ngOnInit(): void {
    this.loadSponsor();
  }

  /**
   * Resout le sponsor designe par l'URL.
   *
   * Le dialogue recevait le sponsor tout fait par `MAT_DIALOG_DATA` : il ne
   * pouvait donc pas connaitre ce cas. Une page, elle, s'atteint par une URL
   * fausse ou perimee, et un identifiant inconnu doit se lire comme une erreur
   * et non comme un sponsor sans image.
   */
  loadSponsor(): void {
    this.loading.set(true);
    this.loadError.set(undefined);
    this.fetchSponsor(true);
  }

  /** Rafraichit apres une mutation, sans repasser par le squelette. */
  private reloadSponsor(): void {
    this.fetchSponsor(false);
  }

  private fetchSponsor(initial: boolean): void {
    this.sponsorsService
      .loadAllSponsors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (sponsors) => {
          if (initial) this.loading.set(false);
          const sponsor = sponsors.find((candidate) => candidate.id === this.sponsorId);
          if (!sponsor) {
            if (initial) {
              this.loadError.set("Ce sponsor n'existe pas.");
            } else {
              this.notifier.error('Ce sponsor a été supprimé');
            }
            return;
          }
          this.sponsor.set(sponsor);
          this.images.set([...sponsor.images].sort((a, b) => a.position - b.position));
        },
        error: (err: unknown) => {
          // Le rechargement du dialogue n'avait **aucun** gestionnaire d'erreur :
          // une panne d'API laissait les emplacements dans leur etat precedent,
          // sans rien dire. C'est le defaut n°1 de l'audit dans sa variante
          // silencieuse.
          if (initial) {
            this.loading.set(false);
            this.loadError.set('Impossible de charger ce sponsor.');
          } else {
            this.notifier.error("Impossible de rafraîchir les images du sponsor");
          }
          if (!environment.production) console.error('Load sponsor images error:', err);
        },
      });
  }

  /**
   * Rattache au sponsor une image qui vient d'etre televersee, puis la place
   * dans son emplacement.
   */
  onImageUploaded(url: string, slotKey: SponsorImageSlotKey): void {
    const sponsor = this.sponsor();
    if (!sponsor) return;

    const slot = this.slots().find((candidate) => candidate.key === slotKey);
    if (!slot) return;

    this.saving.set(true);

    const dto = {
      url,
      alt: `${sponsor.name} - ${slotKey === 'primary' ? 'Logo' : 'Image'}`,
      isPrimary: slotKey === 'primary',
    };

    this.sponsorsService
      .addImage(sponsor.id, dto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (newImage) => this.placeImage(sponsor.id, newImage, slot.position),
        error: (err: unknown) => {
          this.saving.set(false);
          this.notifier.error("Erreur lors de l'ajout de l'image");
          if (!environment.production) console.error('Add image error:', err);
        },
      });
  }

  /**
   * Positionne l'image fraichement ajoutee dans son emplacement.
   *
   * Le dialogue avalait l'echec de cette seconde requete : l'image finissait
   * dans le mauvais emplacement sans que rien ne le signale.
   */
  private placeImage(sponsorId: number, newImage: SponsorImage, position: number): void {
    this.sponsorsService
      .reorderImages(sponsorId, this.getNewOrder(newImage, position))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.notifier.success('Image ajoutée');
          this.reloadSponsor();
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.notifier.error("Image ajoutée, mais son emplacement n'a pas pu être enregistré");
          if (!environment.production) console.error('Reorder images error:', err);
          this.reloadSponsor();
        },
      });
  }

  /** Ordre des identifiants une fois la nouvelle image amenee a sa position. */
  private getNewOrder(newImage: SponsorImage, targetPosition: number): number[] {
    const allImages = [...this.images(), newImage];

    return allImages
      .sort((a, b) => {
        if (a.id === newImage.id) return targetPosition - b.position;
        if (b.id === newImage.id) return a.position - targetPosition;
        return a.position - b.position;
      })
      .map((img) => img.id);
  }

  /** Supprime une image, apres confirmation. */
  removeImage(image: SponsorImage): void {
    const sponsor = this.sponsor();
    if (!sponsor) return;

    this.confirm.delete('cette image').subscribe((confirmed: boolean) => {
      if (!confirmed) return;

      this.saving.set(true);
      this.sponsorsService
        .removeImage(sponsor.id, image.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.notifier.deleted('Image', 'f');
            this.reloadSponsor();
          },
          error: (err: unknown) => {
            this.saving.set(false);
            this.notifier.error('Erreur lors de la suppression');
            if (!environment.production) console.error('Remove image error:', err);
          },
        });
    });
  }

  backToSponsors(): void {
    void this.router.navigate(['/admin/sponsors']);
  }

  /**
   * Contrat de `unsavedChangesGuard`.
   *
   * Il n'y a pas de `form.dirty` a interroger : la page ne porte aucun
   * formulaire reactif, et une image est persistee des que le fichier est
   * choisi — `ImageUploadComponent` televerse immediatement, sans etape de
   * validation. Il n'existe donc pas d'etat « fichier choisi mais pas encore
   * envoye » a proteger.
   *
   * Ce qui existe, et qui se perd sans avertissement, c'est la fenetre entre le
   * choix du fichier et son rattachement au sponsor : le televersement en vol
   * (`uploading()` de chaque zone) et la mutation qui suit (`saving()`). Quitter
   * pendant l'une des deux laisse un fichier sur le serveur et aucune image sur
   * la fiche.
   */
  hasUnsavedChanges(): boolean {
    if (this.saving()) return true;
    return this.uploads().some((upload) => upload.uploading());
  }
}
