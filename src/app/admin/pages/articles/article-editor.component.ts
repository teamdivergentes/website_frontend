import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnDestroy,
  OnInit,
  ViewChild,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import EditorJS, { ToolConstructable } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import ImageTool from '@editorjs/image';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Delimiter from '@editorjs/delimiter';
import Embed from '@editorjs/embed';
import { LinkToolWrapper } from './link-tool-wrapper';
import DragDrop from 'editorjs-drag-drop';
import TextVariantTune from '@editorjs/text-variant-tune';

import { ImageSizeTune } from './image-size-tune';
import { ArticlesService } from '../../../shared/services/articles.service';
import { ArticleTypesService } from '../../../shared/services/article-types.service';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { Article, ArticleType, CreateArticleDto, UpdateArticleDto } from '../../../shared/models';
import { environment } from '../../../../environments/environment';
import { AdminConfirmService } from '../../shared/admin-confirm.service';

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
    MatDialogModule,
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
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly confirm = inject(AdminConfirmService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

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
  private dragDrop: DragDrop | null = null;
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
        },
        error: () => {
          this.loadingTypes.set(false);
        },
      });
  }

  private loadArticle(id: number): void {
    this.loading.set(true);
    this.currentArticle.set(null);
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
          afterNextRender(() => {
            this.initEditor(article.content);
          }, { injector: this.injector });
        },
        error: (err) => {
          this.loading.set(false);
          this.globalError.set("Impossible de charger l'article.");
          console.error('Load article error:', err);
        },
      });
  }

  // ──────────────────────────────────────────────
  // Editor.js
  // ──────────────────────────────────────────────

  private initEditor(existingContent?: string): void {
    if (!this.editorContainer?.nativeElement) return;

    this.destroyEditor();

    const uploadUrl = `${environment.apiUrl}/api/upload/image-editor`; // Endpoint dédié Editor.js : retourne { success: 1, file: { url: "..." } }

    let parsedData: object | undefined;
    if (existingContent) {
      try {
        parsedData = JSON.parse(existingContent);
      } catch {
        // Contenu non JSON, on laisse l'éditeur vide
      }
    }

    // Ne PAS passer data dans le constructeur : les blocs embed
    // nécessitent que prepare() soit terminé (enregistrement des services)
    // avant leur rendu. On initialise l'éditeur vide, puis on charge
    // les données via editor.render() une fois l'éditeur prêt.
    this.editor = new EditorJS({
      holder: this.editorContainer.nativeElement,
      placeholder: 'Commencez à écrire votre article...',
      tools: {
        header: {
          class: Header as unknown as ToolConstructable,
          config: {
            placeholder: 'Titre de la section',
            levels: [2, 3],
            defaultLevel: 2,
          },
        },
        paragraph: {
          class: Paragraph as unknown as ToolConstructable,
          inlineToolbar: true,
          config: {
            placeholder: 'Paragraphe...',
          },
        },
        image: {
          class: ImageTool as unknown as ToolConstructable,
          tunes: ['imageSize'],
          config: {
            endpoints: {
              byFile: uploadUrl,
              byUrl: uploadUrl,
            },
            // Les cookies HttpOnly sont envoyes automatiquement via withCredentials
            additionalRequestHeaders: {},
            field: 'file',
          },
        },
        list: {
          class: List as unknown as ToolConstructable,
          inlineToolbar: true,
          config: {
            defaultStyle: 'unordered',
            styles: ['ordered', 'unordered'],
          },
        },
        quote: {
          class: Quote as unknown as ToolConstructable,
          inlineToolbar: true,
          config: {
            quotePlaceholder: 'Citation...',
            captionPlaceholder: 'Source',
          },
        },
        delimiter: Delimiter as unknown as ToolConstructable,
        embed: {
          class: Embed as unknown as ToolConstructable,
          config: {
            services: {
              youtube: true,
              vimeo: true,
              twitter: true,
              'twitch-clip': {
                regex: /https?:\/\/(?:www\.)?twitch\.tv\/[a-zA-Z0-9_-]+\/clip\/([a-zA-Z0-9_-]+)/,
                embedUrl: 'https://clips.twitch.tv/embed?clip=<%= remote_id %>&parent=localhost&parent=teamdivergentes.fr',
                html: '<iframe width="100%" height="300" style="border:none;" allowfullscreen></iframe>',
              },
              'twitch-video': {
                regex: /https?:\/\/(?:www\.)?twitch\.tv\/videos\/(\d+)/,
                embedUrl: 'https://player.twitch.tv/?video=v<%= remote_id %>&parent=localhost&parent=teamdivergentes.fr',
                html: '<iframe width="100%" height="300" style="border:none;" allowfullscreen></iframe>',
              },
              twitch: {
                regex: /https?:\/\/(?:www\.)?twitch\.tv\/([a-zA-Z0-9_-]+)\/?$/,
                embedUrl: 'https://player.twitch.tv/?channel=<%= remote_id %>&parent=localhost&parent=teamdivergentes.fr',
                html: '<iframe width="100%" height="300" style="border:none;" allowfullscreen></iframe>',
              },
              dailymotion: true,
              spotify: {
                regex: /https?:\/\/open\.spotify\.com\/(track|playlist|album|episode)\/([a-zA-Z0-9]+)/,
                embedUrl: 'https://open.spotify.com/embed/<%= remote_id %>',
                html: '<iframe width="100%" height="380" style="border:none;" allowfullscreen></iframe>',
                id: (groups: string[]) => `${groups[0]}/${groups[1]}`,
              },
            },
          },
        },
        linkTool: {
          class: LinkToolWrapper as unknown as ToolConstructable,
          config: {
            endpoint: `${environment.apiUrl}/api/articles/link-meta`,
            // Les cookies HttpOnly sont envoyes automatiquement
            headers: {},
          },
        },
        textVariant: {
          class: TextVariantTune as unknown as ToolConstructable,
        },
        imageSize: {
          class: ImageSizeTune as unknown as ToolConstructable,
        },
      },
      tunes: ['textVariant'],
      onReady: () => {
        if (parsedData && this.editor) {
          this.editor.render(parsedData as Parameters<typeof EditorJS.prototype['render']>[0]).then(() => {
            this.dragDrop = new DragDrop(this.editor!);
            this.editorReady.set(true);
          });
        } else {
          this.dragDrop = new DragDrop(this.editor!);
          this.editorReady.set(true);
        }
      },
    });
  }

  private destroyEditor(): void {
    if (this.dragDrop) {
      this.dragDrop.destroy();
      this.dragDrop = null;
    }
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
      this.editorReady.set(false);
    }
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

    this.confirm.delete('cet article')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (!confirmed) return;

        this.saving.set(true);
        this.articlesService.deleteArticle(this.articleId!)
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
            },
          });
      });
  }
}
