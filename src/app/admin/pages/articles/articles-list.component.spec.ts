import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ArticlesListComponent } from './articles-list.component';
import { ArticlesService } from '../../../shared/services/articles.service';
import { ArticleTypesService } from '../../../shared/services/article-types.service';
import type { Article, ArticleQueryParams, ArticleType } from '../../../shared/models/article.model';

const mockArticle: Article = {
  id: 1,
  title: 'Titre',
  slug: 'titre',
  content: '',
  excerpt: null,
  imageUrl: null,
  published: true,
  featured: false,
  typeId: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
} as unknown as Article;

describe('ArticlesListComponent — pagination serveur', () => {
  let fixture: ComponentFixture<ArticlesListComponent>;
  let component: ArticlesListComponent;
  let articlesService: jasmine.SpyObj<ArticlesService>;

  /** Derniers paramètres passés à getArticles. */
  function lastParams(): ArticleQueryParams {
    return articlesService.getArticles.calls.mostRecent().args[0] as ArticleQueryParams;
  }

  beforeEach(async () => {
    const articlesSpy = jasmine.createSpyObj<ArticlesService>('ArticlesService', ['getArticles'], {
      allArticles: signal([mockArticle]),
    });
    const mockTypes = [{ id: 1, name: 'Actualités' }] as unknown as ArticleType[];
    const typesSpy = jasmine.createSpyObj<ArticleTypesService>(
      'ArticleTypesService',
      ['getArticleTypes'],
      { allTypes: signal(mockTypes) },
    );

    articlesSpy.getArticles.and.returnValue(
      of({ data: [mockArticle], meta: { total: 137, page: 1, limit: 20, totalPages: 7 } }),
    );
    typesSpy.getArticleTypes.and.returnValue(of(mockTypes));

    await TestBed.configureTestingModule({
      imports: [ArticlesListComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ArticlesService, useValue: articlesSpy },
        { provide: ArticleTypesService, useValue: typesSpy },
        { provide: MatDialog, useValue: jasmine.createSpyObj('MatDialog', ['open']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ArticlesListComponent);
    component = fixture.componentInstance;
    articlesService = TestBed.inject(ArticlesService) as jasmine.SpyObj<ArticlesService>;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  // ─── Le defaut corrige : limit 100 sans page suivante ─────────────────────

  it('ne demande plus 100 articles d’un coup', () => {
    expect(lastParams().limit).not.toBe(100);
  });

  it('demande la première page avec une taille raisonnable', () => {
    expect(lastParams().page).toBe(1);
    expect(lastParams().limit).toBe(20);
  });

  it('expose le total renvoyé par le serveur', () => {
    expect(component.totalArticles()).toBe(137);
  });

  // ─── Pagination ───────────────────────────────────────────────────────────

  it('recharge en changeant de page', () => {
    component.onPageChange({ pageIndex: 2, pageSize: 20, length: 137 });

    expect(lastParams().page).toBe(3);
    expect(lastParams().limit).toBe(20);
  });

  it('revient en première page quand la taille de page change', () => {
    component.onPageChange({ pageIndex: 3, pageSize: 20, length: 137 });
    component.onPageChange({ pageIndex: 3, pageSize: 50, length: 137 });

    expect(lastParams().limit).toBe(50);
    expect(lastParams().page).toBe(1);
  });

  // ─── Tri serveur ──────────────────────────────────────────────────────────

  it('trie côté serveur et non sur la seule page visible', () => {
    component.onSort({ active: 'title', direction: 'asc' });

    expect(lastParams().sortBy).toBe('title');
    expect(lastParams().sortOrder).toBe('asc');
  });

  it('revient au tri par défaut quand le tri est annulé', () => {
    component.onSort({ active: '', direction: '' });

    expect(lastParams().sortBy).toBe('createdAt');
    expect(lastParams().sortOrder).toBe('desc');
  });

  it('repart en première page après un changement de tri', () => {
    component.onPageChange({ pageIndex: 4, pageSize: 20, length: 137 });
    component.onSort({ active: 'title', direction: 'asc' });

    expect(lastParams().page).toBe(1);
  });

  // ─── Filtres ──────────────────────────────────────────────────────────────

  it('filtre par statut de publication', () => {
    component.onPublishedFilterChange(false);

    expect(lastParams().published).toBeFalse();
  });

  it('filtre par catégorie', () => {
    component.onTypeFilterChange(1);

    expect(lastParams().typeId).toBe(1);
  });

  it('omet le filtre quand aucun statut n’est choisi', () => {
    component.onPublishedFilterChange(null);

    expect(lastParams().published).toBeUndefined();
  });

  it('repart en première page après un changement de filtre', () => {
    component.onPageChange({ pageIndex: 4, pageSize: 20, length: 137 });
    component.onTypeFilterChange(1);

    expect(lastParams().page).toBe(1);
  });
});
