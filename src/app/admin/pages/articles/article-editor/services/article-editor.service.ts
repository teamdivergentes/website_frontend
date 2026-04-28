import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import EditorJS from '@editorjs/editorjs';
import { ArticlesService } from '../../../../../shared/services/articles.service';
import { ConfirmDialogComponent } from '../../../../shared/confirm-dialog.component';
import { CreateArticleDto, UpdateArticleDto } from '../../../../../shared/models';

export interface ArticleSavePayload {
  title: string;
  slug: string;
  excerpt: string;
  imageUrl: string;
  mobileImageUrl: string;
  tabletImageUrl: string;
  published: boolean;
  featured: boolean;
  typeId: string;
}

/**
 * Service responsable des opérations CRUD sur les articles.
 * Extrait du composant parent pour réduire sa taille.
 * Non `providedIn: 'root'` — instancié dans le scope du composant éditeur.
 */
@Injectable()
export class ArticleEditorService {
  private readonly articlesService = inject(ArticlesService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly saving = signal<boolean>(false);
  readonly globalError = signal<string | undefined>(undefined);

  async save(
    isEditMode: boolean,
    articleId: number | null,
    formValue: ArticleSavePayload,
    editorInstance: EditorJS | null,
  ): Promise<void> {
    this.saving.set(true);
    this.globalError.set(undefined);

    const content = await this.extractEditorContent(editorInstance);

    if (isEditMode && articleId) {
      this.updateArticle(articleId, formValue, content);
    } else {
      this.createArticle(formValue, content);
    }
  }

  confirmDelete(articleId: number): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      maxWidth: '95vw',
      data: {
        title: 'Confirmer la suppression',
        message: 'Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.',
      },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: unknown) => {
        if (!confirmed) return;
        this.deleteArticle(articleId);
      });
  }

  // ──────────────────────────────────────────────
  // Méthodes privées
  // ──────────────────────────────────────────────

  private async extractEditorContent(editor: EditorJS | null): Promise<string> {
    if (!editor) return '{}';
    try {
      const outputData = await editor.save();
      return JSON.stringify(outputData);
    } catch (err: unknown) {
      console.error('Editor.js save error:', err);
      return '{}';
    }
  }

  private updateArticle(
    articleId: number,
    formValue: ArticleSavePayload,
    content: string,
  ): void {
    const updateDto: UpdateArticleDto = {
      title: formValue.title,
      slug: formValue.slug,
      content,
      excerpt: formValue.excerpt || undefined,
      imageUrl: formValue.imageUrl || undefined,
      mobileImageUrl: formValue.mobileImageUrl || undefined,
      tabletImageUrl: formValue.tabletImageUrl || undefined,
      published: formValue.published,
      featured: formValue.featured,
      typeId: Number(formValue.typeId),
    };

    this.articlesService
      .updateArticle(articleId, updateDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Article mis à jour avec succès', 'Fermer', { duration: 3000 });
          this.router.navigate(['/admin/articles']);
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.globalError.set("Erreur lors de la mise à jour de l'article.");
          console.error('Update article error:', err);
        },
      });
  }

  private createArticle(formValue: ArticleSavePayload, content: string): void {
    const createDto: CreateArticleDto = {
      title: formValue.title,
      content,
      excerpt: formValue.excerpt || undefined,
      imageUrl: formValue.imageUrl || undefined,
      mobileImageUrl: formValue.mobileImageUrl || undefined,
      tabletImageUrl: formValue.tabletImageUrl || undefined,
      published: formValue.published,
      featured: formValue.featured,
      typeId: Number(formValue.typeId),
    };

    this.articlesService
      .createArticle(createDto)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Article créé avec succès', 'Fermer', { duration: 3000 });
          this.router.navigate(['/admin/articles']);
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.globalError.set("Erreur lors de la création de l'article.");
          console.error('Create article error:', err);
        },
      });
  }

  private deleteArticle(articleId: number): void {
    this.saving.set(true);
    this.articlesService
      .deleteArticle(articleId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Article supprimé', 'Fermer', { duration: 3000 });
          this.router.navigate(['/admin/articles']);
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.globalError.set("Erreur lors de la suppression de l'article.");
          console.error('Delete article error:', err);
        },
      });
  }
}
