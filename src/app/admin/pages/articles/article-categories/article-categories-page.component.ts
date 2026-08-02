import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ArticleTypesService } from '../../../../shared/services/article-types.service';
import { ArticleType } from '../../../../shared/models';
import { ArticleCategoryDialogComponent } from './article-category-dialog.component';
import { AdminConfirmService } from '../../../shared/admin-confirm.service';
import { AdminDialogService } from '../../../shared/admin-dialog.service';
import { AdminNotifier } from '../../../shared/admin-notifier.service';
import { EmptyStateComponent } from '../../../shared/empty-state.component';
import { ErrorStateComponent } from '../../../shared/error-state.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { SkeletonComponent } from '../../../shared/skeleton.component';
import { environment } from '../../../../../environments/environment';
import { navigateAway } from '../../../shared/navigate-away';

/**
 * Gestion des categories d'articles (`ArticleType`).
 *
 * C'etait le seul **dialogue dans un dialogue** du panel : la liste des
 * categories s'ouvrait en `md` depuis la liste des articles, et ouvrait a son
 * tour le formulaire de categorie en `sm`. Deux overlays empiles produisent deux
 * pieges de focus imbriques — `Echap` ferme le second, et le premier reste
 * ouvert derriere sans que rien ne l'annonce a un lecteur d'ecran. C'est la
 * seule interdiction absolue de la regle inscrite dans `frontend/CLAUDE.md`.
 *
 * La migration est une **de-imbrication**, pas un changement de palier : cet
 * ecran n'etait pas trop large, il etait au mauvais etage. Une fois la liste
 * devenue page, le formulaire de categorie **reste un dialogue** `sm` — un seul
 * controle, aucun sous-editeur, aucune liste enfant : il satisfait les trois
 * conditions, et un dialogue ouvert depuis une page ne viole rien.
 *
 * La page n'implemente donc pas `HasUnsavedChanges` : elle ne porte aucun
 * `FormControl`. Le seul etat volatil de ce parcours vit dans le dialogue
 * enfant, qui se ferme par un geste explicite — il n'y a rien qu'un retour
 * arriere du navigateur pourrait faire perdre en silence.
 */
@Component({
  selector: 'app-article-categories-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatTooltipModule,
    EmptyStateComponent,
    ErrorStateComponent,
    PageHeaderComponent,
    SkeletonComponent,
  ],
  template: `
    <app-page-header
      title="Catégories d'articles"
      [count]="loadError() ? null : categories().length"
      countLabel="catégorie"
    >
      <button
        leading
        mat-icon-button
        class="back-button"
        type="button"
        aria-label="Retour aux articles"
        (click)="backToArticles()"
      >
        <mat-icon aria-hidden="true">arrow_back</mat-icon>
      </button>

      <button
        actions
        mat-raised-button
        color="primary"
        type="button"
        aria-label="Créer une nouvelle catégorie"
        [disabled]="loading() || !!loadError()"
        (click)="openCreateDialog()"
      >
        <mat-icon aria-hidden="true">add</mat-icon>
        Nouvelle catégorie
      </button>
    </app-page-header>

    @if (loadError()) {
      <app-error-state [message]="loadError()!" [retrying]="loading()" (retry)="loadCategories()" />
    } @else if (loading()) {
      <app-skeleton variant="table" [rows]="3" [columns]="3" />
    } @else if (categories().length === 0) {
      <app-empty-state
        entity="catégorie"
        gender="f"
        icon="label_off"
        actionLabel="Nouvelle catégorie"
        (action)="openCreateDialog()"
      />
    } @else {
      <div class="table-container">
        <table
          mat-table
          [dataSource]="categories()"
          class="categories-table"
          aria-label="Tableau des catégories"
        >
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>Nom</th>
            <td mat-cell *matCellDef="let cat" class="col-name">{{ cat.name }}</td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Créée le</th>
            <td mat-cell *matCellDef="let cat">{{ formatDate(cat.createdAt) }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="col-actions">Actions</th>
            <td mat-cell *matCellDef="let cat" class="col-actions">
              <button
                mat-icon-button
                type="button"
                [attr.aria-label]="'Modifier ' + cat.name"
                matTooltip="Modifier"
                (click)="openEditDialog(cat)"
              >
                <mat-icon aria-hidden="true">edit</mat-icon>
              </button>
              <button
                mat-icon-button
                type="button"
                color="warn"
                [attr.aria-label]="'Supprimer ' + cat.name"
                matTooltip="Supprimer"
                (click)="confirmDelete(cat)"
              >
                <mat-icon aria-hidden="true">delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns" [attr.data-id]="row.id"></tr>
        </table>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .back-button {
        margin-right: var(--admin-space-2);
      }

      // Le dialogue bornait son contenu a la largeur du palier md (600px). En
      // page, c'est le document qui defile ; seule reste la borne de contenu du
      // panel. Un tableau en une colonne de contenu, donc --admin-page-max :
      // la largeur de la modale d'origine n'est pas un argument, et la colonne
      // d'actions est bornee a 7rem — c'est le nom qui absorbe le reste.
      // Voir _admin-tokens.scss.
      .table-container {
        max-width: var(--admin-page-max);
      }

      .col-name {
        font-weight: 600;
      }

      .col-actions {
        width: 7rem;
        text-align: right;
        white-space: nowrap;
      }
    `,
  ],
})
export class ArticleCategoriesPageComponent implements OnInit {
  private readonly typesService = inject(ArticleTypesService);
  private readonly router = inject(Router);
  private readonly confirm = inject(AdminConfirmService);
  private readonly adminDialog = inject(AdminDialogService);
  private readonly notifier = inject(AdminNotifier);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading = signal<boolean>(false);
  /** Echec de chargement : bloquant, la page n'a alors rien a montrer. */
  readonly loadError = signal<string | undefined>(undefined);

  readonly displayedColumns = ['name', 'createdAt', 'actions'];

  readonly categories = this.typesService.allTypes;

  ngOnInit(): void {
    this.loadCategories();
  }

  /**
   * Charge les categories.
   *
   * Le dialogue signalait l'echec par un snackbar de 3 secondes puis rendait
   * son etat vide : passe le delai, une panne d'API se lisait « Aucune
   * categorie creee », et l'administrateur pouvait recreer des categories deja
   * existantes. C'est la variante n°1 de l'audit de l'EPIC-41 ; l'erreur est
   * desormais bloquante et reessayable.
   */
  loadCategories(): void {
    this.loading.set(true);
    this.loadError.set(undefined);

    this.typesService
      .getArticleTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.loading.set(false),
        error: (err: unknown) => {
          this.loading.set(false);
          this.loadError.set('Impossible de charger les catégories.');
          if (!environment.production) console.error('Load article categories error:', err);
        },
      });
  }

  /**
   * Ouvre le formulaire de categorie.
   *
   * Le dialogue reste un dialogue : un controle, aucun sous-editeur, aucune
   * liste enfant. Ce qui le condamnait n'etait pas sa taille mais son parent.
   *
   * Aucun rechargement ne suit l'enregistrement : `ArticleTypesService` tient sa
   * propre liste a jour a partir de la reponse du serveur, et `categories()` en
   * derive. Un appel de plus ne ferait que rejouer la requete que le service
   * vient d'ecouter.
   */
  openCreateDialog(): void {
    this.openCategoryDialog(undefined);
  }

  openEditDialog(category: ArticleType): void {
    this.openCategoryDialog(category);
  }

  private openCategoryDialog(category: ArticleType | undefined): void {
    this.adminDialog
      .open(ArticleCategoryDialogComponent, 'sm', { category })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((saved) => {
        if (!saved) return;
        this.notifier.saved('Catégorie', category ? 'edit' : 'create', 'f');
      });
  }

  /**
   * Supprime une categorie, apres confirmation.
   *
   * Le refus du backend sur une categorie utilisee (409) garde son message
   * d'origine : c'est la seule reponse qui explique a l'administrateur ce qu'il
   * doit faire avant de reessayer.
   */
  confirmDelete(category: ArticleType): void {
    this.confirm
      .delete('la catégorie', category.name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) return;

        this.typesService
          .deleteArticleType(category.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => this.notifier.deleted('Catégorie', 'f'),
            error: (err: HttpErrorResponse) => {
              this.notifier.error(
                err.status === 409
                  ? 'Impossible de supprimer : des articles utilisent cette catégorie'
                  : 'Erreur lors de la suppression',
              );
              if (!environment.production) console.error('Delete article category error:', err);
            },
          });
      });
  }

  backToArticles(): void {
    navigateAway(this.router, ['/admin/articles']);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
