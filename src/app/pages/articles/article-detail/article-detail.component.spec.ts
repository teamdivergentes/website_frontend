import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ArticleDetailComponent } from './article-detail.component';
import { ArticlesService } from '../../../shared/services/articles.service';
import { SeoService } from '../../../shared/services/seo.service';
import { Article } from '../../../shared/models';

const mockArticle: Article = {
  id: 42,
  title: 'Test Article',
  slug: 'test-article',
  content: 'Contenu de test',
  excerpt: 'Un extrait de test',
  imageUrl: '/uploads/test.jpg',
  published: true,
  featured: false,
  typeId: 1,
  userId: 1,
  createdAt: '2026-03-01T10:00:00.000Z',
  updatedAt: '2026-04-15T12:00:00.000Z',
};

describe('ArticleDetailComponent', () => {
  let component: ArticleDetailComponent;
  let fixture: ComponentFixture<ArticleDetailComponent>;
  let seoService: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    const seoSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags', 'setJsonLd', 'clearJsonLd']);
    const articlesSpy = jasmine.createSpyObj('ArticlesService', ['getArticleBySlug', 'getArticles']);

    articlesSpy.getArticleBySlug.and.returnValue(of(mockArticle));
    articlesSpy.getArticles.and.returnValue(of({ data: [], total: 0, page: 1, limit: 4, totalPages: 1 }));

    await TestBed.configureTestingModule({
      imports: [ArticleDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: seoSpy },
        { provide: ArticlesService, useValue: articlesSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(new Map([['slug', 'test-article']])),
          },
        },
      ],
    }).compileComponents();

    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;

    fixture = TestBed.createComponent(ArticleDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // US-og-article-times (EPIC-23): intégration dans article-detail
  it('should call updateMetaTags with publishedTime from article.createdAt', () => {
    expect(seoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        publishedTime: mockArticle.createdAt,
      })
    );
  });

  it('should call updateMetaTags with modifiedTime from article.updatedAt', () => {
    expect(seoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        modifiedTime: mockArticle.updatedAt,
      })
    );
  });

  it('should call updateMetaTags with type article', () => {
    expect(seoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        type: 'article',
      })
    );
  });

  it('should call updateMetaTags with article title', () => {
    expect(seoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        title: mockArticle.title,
      })
    );
  });

  it('should call setJsonLd after loading article', () => {
    expect(seoService.setJsonLd).toHaveBeenCalled();
  });
});
