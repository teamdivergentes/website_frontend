import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import EditorJS from '@editorjs/editorjs';
// @ts-ignore
import Header from '@editorjs/header';
// @ts-ignore
import Paragraph from '@editorjs/paragraph';
// @ts-ignore
import ImageTool from '@editorjs/image';
// @ts-ignore
import List from '@editorjs/list';
// @ts-ignore
import Quote from '@editorjs/quote';
// @ts-ignore
import Delimiter from '@editorjs/delimiter';
// @ts-ignore
import Embed from '@editorjs/embed';

import { ArticlesService } from '../../../shared/services/articles.service';
import { ArticleTypesService } from '../../../shared/services/article-types.service';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { Article, ArticleType, CreateArticleDto, UpdateArticleDto } from '../../../shared/models';
import { AuthService } from '../../../../shared/services/api/auth.service';
import { environment } from '../../../../environments/environment';

/**
 * Transforme un titre en slug URL-friendly
 * Ex: "Mon Super Article !" → "mon-super-article"
 */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Supprime les caractères spéciaux
    .trim()
    .replace(/\s+/g, '-') // Espaces → tirets
    .replace(/-+/g, '-') // Tirets multiples → un seul
    .replace(/^-|-$/g, ''); // Tirets en début/fin
}

@Component({
  selector: 'app-article-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatIconModule,
    MatSlideToggleModule,
    DatePipe,
    ImageUploadComponent,
  ],
  templateUrl: './article-editor.component.html',
  styleUrls: ['./article-editor.component.scss'],
})
export class ArticleEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef<HTMLDivElement>;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly articlesService = inject(ArticlesService);
  private readonly articleTypesService = inject(ArticleTypesService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  // State signals
  readonly loading = signal<boolean>(false);
  readonly loadingTypes = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly editorReady = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly currentArticle = signal<Article | null>(null);
  readonly articleTypes = signal<ArticleType[]>([]);
  readonly globalError = signal<string | undefined>(undefined);

  // Editor.js instance
  private editor: EditorJS | null = null;
  private articleId: number | null = null;
  // Track if the article was published when loaded (to avoid slug re-generation)
  private wasPublishedOnLoad = false;

  readonly form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(255)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    typeId: ['', Validators.required],
    excerpt: ['', Validators.maxLength(500)],
    imageUrl: [''],
    mobileImageUrl: [''],
    tabletImageUrl: [''],
    published: [false],
    featured: [false],
  });

  ngOnInit(): void {
    // Charger les catégories
    this.loadArticleTypes();

    // Détecter mode édition via le paramètre :id
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode.set(true);
      this.articleId = Number(idParam);
      this.loadArticle(this.articleId);
    }

    // Auto-slug depuis le titre (seulement en mode création, ou si article non publié)
    this.form.get('title')!.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((title: string) => {
        // En mode édition, ne pas re-générer le slug si l'article était publié
        if (this.isEditMode() && this.wasPublishedOnLoad) {
          return;
        }
        if (title) {
          this.form.get('slug')!.setValue(slugify(title), { emitEvent: false });
        }
      });
  }

  ngAfterViewInit(): void {
    // L'éditeur sera initialisé après le chargement si mode édition,
    // ou immédiatement en mode création
    if (!this.isEditMode()) {
      this.initEditor();
    }
  }

  ngOnDestroy(): void {
    this.destroyEditor();
  }

  // ──────────────────────────────────────────────
  // Chargement des données
  // ──────────────────────────────────────────────

  private loadArticleTypes(): void {
    this.loadingTypes.set(true);
    this.articleTypesService.getArticleTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (types) => {
          this.articleTypes.set(types);
          this.loadingTypes.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingTypes.set(false);
          this.cdr.markForCheck();
        },
      });
  }

  private loadArticle(id: number): void {
    this.loading.set(true);
    this.globalError.set(undefined);

    this.articlesService.getArticleById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (article) => {
          this.currentArticle.set(article);
          this.wasPublishedOnLoad = article.published;

          this.form.patchValue({
            title: article.title,
            slug: article.slug,
            typeId: article.typeId,
            excerpt: article.excerpt ?? '',
            imageUrl: article.imageUrl ?? '',
            mobileImageUrl: article.mobileImageUrl ?? '',
            tabletImageUrl: article.tabletImageUrl ?? '',
            published: article.published,
            featured: article.featured,
          });

          this.loading.set(false);
          this.cdr.markForCheck();

          // Initialiser Editor.js après le chargement de l'article
          // Attendre que la vue soit mise à jour
          setTimeout(() => {
            this.initEditor(article.content);
          }, 100);
        },
        error: (err) => {
          this.loading.set(false);
          this.globalError.set("Impossible de charger l'article.");
          console.error('Load article error:', err);
          this.cdr.markForCheck();
        },
      });
  }

  // ──────────────────────────────────────────────
  // Editor.js
  // ──────────────────────────────────────────────

  private initEditor(existingContent?: string): void {
    if (!this.editorContainer?.nativeElement) return;

    this.destroyEditor();

    const token = this.authService.getToken();
    const uploadUrl = `${environment.apiUrl}/api/upload/image`;

    let parsedData: object | undefined;
    if (existingContent) {
      try {
        parsedData = JSON.parse(existingContent);
      } catch {
        // Contenu non JSON, on laisse l'éditeur vide
      }
    }

    this.editor = new EditorJS({
      holder: this.editorContainer.nativeElement,
      placeholder: 'Commencez à écrire votre article...',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: parsedData as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: {
        header: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          class: Header as any,
          config: {
            placeholder: 'Titre de la section',
            levels: [2, 3, 4],
            defaultLevel: 2,
          },
        },
        paragraph: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          class: Paragraph as any,
          inlineToolbar: true,
          config: {
            placeholder: 'Paragraphe...',
          },
        },
        image: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          class: ImageTool as any,
          config: {
            endpoints: {
              byFile: uploadUrl,
              byUrl: uploadUrl,
            },
            additionalRequestHeaders: token
              ? { Authorization: `Bearer ${token}` }
              : {},
            field: 'file',
          },
        },
        list: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          class: List as any,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered',
          },
        },
        quote: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          class: Quote as any,
          inlineToolbar: true,
          config: {
            quotePlaceholder: 'Citation...',
            captionPlaceholder: 'Source',
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delimiter: Delimiter as any,
        embed: {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          class: Embed as any,
          config: {
            services: {
              youtube: true,
              coub: true,
              twitch: true,
              twitter: true,
            },
          },
        },
      },
      onReady: () => {
        this.editorReady.set(true);
        this.cdr.markForCheck();
      },
    });
  }

  private destroyEditor(): void {
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
      this.editorReady.set(false);
    }
  }

  // ──────────────────────────────────────────────
  // Événements du titre (slugify)
  // ──────────────────────────────────────────────

  onTitleInput(): void {
    // Géré via valueChanges dans ngOnInit
  }

  // ──────────────────────────────────────────────
  // Upload d'images
  // ──────────────────────────────────────────────

  onImageUploaded(field: 'imageUrl' | 'mobileImageUrl' | 'tabletImageUrl', url: string): void {
    this.form.patchValue({ [field]: url });
  }

  onImageRemoved(field: 'imageUrl' | 'mobileImageUrl' | 'tabletImageUrl'): void {
    this.form.patchValue({ [field]: '' });
  }

  // ──────────────────────────────────────────────
  // Sauvegarde
  // ──────────────────────────────────────────────

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.globalError.set(undefined);

    // Récupérer le contenu Editor.js en JSON
    let content = '{}';
    if (this.editor) {
      try {
        const outputData = await this.editor.save();
        content = JSON.stringify(outputData);
      } catch (err) {
        console.error('Editor.js save error:', err);
      }
    }

    const formValue = this.form.value;

    if (this.isEditMode() && this.articleId) {
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

      this.articlesService.updateArticle(this.articleId, updateDto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.snackBar.open('Article mis à jour avec succès', 'Fermer', { duration: 3000 });
            this.router.navigate(['/admin/articles']);
          },
          error: (err) => {
            this.saving.set(false);
            this.globalError.set("Erreur lors de la mise à jour de l'article.");
            console.error('Update article error:', err);
            this.cdr.markForCheck();
          },
        });
    } else {
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

      this.articlesService.createArticle(createDto)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.snackBar.open('Article créé avec succès', 'Fermer', { duration: 3000 });
            this.router.navigate(['/admin/articles']);
          },
          error: (err) => {
            this.saving.set(false);
            this.globalError.set("Erreur lors de la création de l'article.");
            console.error('Create article error:', err);
            this.cdr.markForCheck();
          },
        });
    }
  }

  cancel(): void {
    this.router.navigate(['/admin/articles']);
  }

  // ──────────────────────────────────────────────
  // Suppression
  // ──────────────────────────────────────────────

  confirmDelete(): void {
    if (!this.articleId) return;

    const confirmed = window.confirm(
      'Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.'
    );

    if (!confirmed) return;

    this.saving.set(true);
    this.articlesService.deleteArticle(this.articleId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Article supprimé', 'Fermer', { duration: 3000 });
          this.router.navigate(['/admin/articles']);
        },
        error: (err) => {
          this.saving.set(false);
          this.globalError.set("Erreur lors de la suppression de l'article.");
          console.error('Delete article error:', err);
          this.cdr.markForCheck();
        },
      });
  }
}
