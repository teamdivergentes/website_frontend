import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Injector,
  OnInit,
  ViewChild,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import EditorJS from '@editorjs/editorjs';
import { ArticleTypesService } from '../../../shared/services/article-types.service';
import { ArticlesService } from '../../../shared/services/articles.service';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { Article, ArticleType } from '../../../shared/models';
import { ArticleBlockEditorComponent } from './article-editor/components/article-block-editor/article-block-editor.component';
import { ArticleToolbarComponent } from './article-editor/components/article-toolbar/article-toolbar.component';
import { ArticleEditorService } from './article-editor/services/article-editor.service';
import { slugify } from './article-editor/article-validators';

@Component({
  selector: 'app-article-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ArticleEditorService],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatDialogModule,
    MatIconModule,
    MatSlideToggleModule,
    DatePipe,
    ImageUploadComponent,
    ArticleBlockEditorComponent,
    ArticleToolbarComponent,
  ],
  templateUrl: './article-editor.component.html',
  styleUrls: ['./article-editor.component.scss'],
})
export class ArticleEditorComponent implements OnInit, AfterViewInit {
  @ViewChild(ArticleBlockEditorComponent) blockEditor!: ArticleBlockEditorComponent;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly articlesService = inject(ArticlesService);
  private readonly articleTypesService = inject(ArticleTypesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  readonly editorCrudService = inject(ArticleEditorService);

  readonly loading = signal<boolean>(false);
  readonly loadingTypes = signal<boolean>(false);
  readonly isEditMode = signal<boolean>(false);
  readonly currentArticle = signal<Article | null>(null);
  readonly articleTypes = signal<ArticleType[]>([]);

  private editorInstance: EditorJS | null = null;
  private articleId: number | null = null;
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

  // Proxies vers le service CRUD pour le template
  get saving() { return this.editorCrudService.saving; }
  get globalError() { return this.editorCrudService.globalError; }

  ngOnInit(): void {
    this.loadArticleTypes();

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode.set(true);
      this.articleId = Number(idParam);
      this.loadArticle(this.articleId);
    }

    this.form
      .get('title')!
      .valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((title: string) => {
        if (this.isEditMode() && this.wasPublishedOnLoad) return;
        if (title) {
          this.form.get('slug')!.setValue(slugify(title), { emitEvent: false });
        }
      });
  }

  ngAfterViewInit(): void {
    if (!this.isEditMode()) {
      this.blockEditor?.init();
    }
  }

  onEditorReady(editor: EditorJS): void {
    this.editorInstance = editor;
  }

  onImageUploaded(field: 'imageUrl' | 'mobileImageUrl' | 'tabletImageUrl', url: string): void {
    this.form.patchValue({ [field]: url });
  }

  onImageRemoved(field: 'imageUrl' | 'mobileImageUrl' | 'tabletImageUrl'): void {
    this.form.patchValue({ [field]: '' });
  }

  async save(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    await this.editorCrudService.save(
      this.isEditMode(),
      this.articleId,
      this.form.value,
      this.editorInstance,
    );
  }

  cancel(): void {
    this.router.navigate(['/admin/articles']);
  }

  confirmDelete(): void {
    if (!this.articleId) return;
    this.editorCrudService.confirmDelete(this.articleId);
  }

  // ──────────────────────────────────────────────
  // Chargement
  // ──────────────────────────────────────────────

  private loadArticleTypes(): void {
    this.loadingTypes.set(true);
    this.articleTypesService
      .getArticleTypes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (types: ArticleType[]) => {
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

    this.articlesService
      .getArticleById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (article: Article) => {
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
          afterNextRender(
            () => {
              this.blockEditor?.init();
            },
            { injector: this.injector },
          );
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.editorCrudService.globalError.set("Impossible de charger l'article.");
          console.error('Load article error:', err);
        },
      });
  }
}
