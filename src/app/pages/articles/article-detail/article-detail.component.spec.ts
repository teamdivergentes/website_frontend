import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
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
    const seoSpy = jasmine.createSpyObj('SeoService', [
      'updateMetaTags',
      'setJsonLd',
      'clearJsonLd',
      'buildArticleJsonLd',
      'getBreadcrumbListJsonLd',
    ]);
    // Les méthodes de construction retournent un objet vide — seule la délégation est testée
    seoSpy.buildArticleJsonLd.and.returnValue({});
    seoSpy.getBreadcrumbListJsonLd.and.returnValue({});
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

  it('should delegate JSON-LD construction to seoService.buildArticleJsonLd', () => {
    expect(seoService.buildArticleJsonLd).toHaveBeenCalledWith(
      jasmine.objectContaining({ slug: mockArticle.slug }),
    );
  });

  it('should delegate breadcrumb construction to seoService.getBreadcrumbListJsonLd', () => {
    expect(seoService.getBreadcrumbListJsonLd).toHaveBeenCalled();
  });

  it('should call updateMetaTags with articleAuthor', () => {
    expect(seoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({
        articleAuthor: jasmine.any(String),
      }),
    );
  });

  // -------------------------------------------------------------------------
  // US P1 — Hero image responsive <picture> + fetchpriority
  // -------------------------------------------------------------------------

  describe('hero image <picture> responsive rendering', () => {
    it('should render 0 <source> elements when article has only imageUrl', () => {
      // mockArticle n'a ni mobileImageUrl ni tabletImageUrl
      const sources = fixture.debugElement.queryAll(By.css('source'));
      expect(sources.length).toBe(0);
    });

    it('should render 1 <source> element when article has only mobileImageUrl', async () => {
      const articlesSpy = TestBed.inject(ArticlesService) as jasmine.SpyObj<ArticlesService>;
      const articleWithMobile: Article = {
        ...mockArticle,
        mobileImageUrl: '/uploads/mobile.webp',
      };
      articlesSpy.getArticleBySlug.and.returnValue(of(articleWithMobile));

      // Recrée le composant avec le nouveau stub
      const localFixture = TestBed.createComponent(ArticleDetailComponent);
      localFixture.detectChanges();
      await localFixture.whenStable();
      localFixture.detectChanges();

      const sources = localFixture.debugElement.queryAll(By.css('source'));
      expect(sources.length).toBe(1);
      expect(sources[0].attributes['media']).toBe('(max-width: 599px)');
      localFixture.destroy();
    });

    it('should render 2 <source> elements when article has mobileImageUrl AND tabletImageUrl', async () => {
      const articlesSpy = TestBed.inject(ArticlesService) as jasmine.SpyObj<ArticlesService>;
      const articleWithAll: Article = {
        ...mockArticle,
        mobileImageUrl: '/uploads/mobile.webp',
        tabletImageUrl: '/uploads/tablet.webp',
      };
      articlesSpy.getArticleBySlug.and.returnValue(of(articleWithAll));

      const localFixture = TestBed.createComponent(ArticleDetailComponent);
      localFixture.detectChanges();
      await localFixture.whenStable();
      localFixture.detectChanges();

      const sources = localFixture.debugElement.queryAll(By.css('source'));
      expect(sources.length).toBe(2);
      expect(sources[0].attributes['media']).toBe('(max-width: 599px)');
      expect(sources[1].attributes['media']).toBe('(max-width: 1024px)');
      localFixture.destroy();
    });

    it('should set loading="eager" on the hero <img>', () => {
      const heroImg = fixture.debugElement.query(By.css('.article-hero__img'));
      expect(heroImg).toBeTruthy();
      expect(heroImg.attributes['loading']).toBe('eager');
    });

    it('should set fetchpriority="high" on the hero <img>', () => {
      const heroImg = fixture.debugElement.query(By.css('.article-hero__img'));
      expect(heroImg).toBeTruthy();
      expect(heroImg.attributes['fetchpriority']).toBe('high');
    });
  });

  // -------------------------------------------------------------------------
  // US P1 — heroAlt : texte alt enrichi
  // -------------------------------------------------------------------------

  describe('heroAlt()', () => {
    it('should return only the title when type is absent', () => {
      const article: Article = { ...mockArticle, type: undefined };
      expect(component.heroAlt(article)).toBe('Test Article');
    });

    it('should return "title — section" when type is present', () => {
      const article: Article = {
        ...mockArticle,
        type: { id: 1, name: 'Esport', createdAt: '', updatedAt: '' },
      };
      expect(component.heroAlt(article)).toBe('Test Article — Esport');
    });

    it('should reflect the heroAlt on the hero <img> alt attribute in the DOM', async () => {
      const articlesSpy = TestBed.inject(ArticlesService) as jasmine.SpyObj<ArticlesService>;
      const articleWithType: Article = {
        ...mockArticle,
        type: { id: 2, name: 'Gaming', createdAt: '', updatedAt: '' },
      };
      articlesSpy.getArticleBySlug.and.returnValue(of(articleWithType));

      const localFixture = TestBed.createComponent(ArticleDetailComponent);
      localFixture.detectChanges();
      await localFixture.whenStable();
      localFixture.detectChanges();

      const heroImg = localFixture.debugElement.query(By.css('.article-hero__img'));
      expect(heroImg).toBeTruthy();
      expect(heroImg.attributes['alt']).toBe('Test Article — Gaming');
      localFixture.destroy();
    });
  });
});
