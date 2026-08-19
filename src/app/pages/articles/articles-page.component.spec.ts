import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

registerLocaleData(localeFr);

import { ArticlesPageComponent } from './articles-page.component';
import { ArticlesService } from '../../shared/services/articles.service';
import { ArticleTypesService } from '../../shared/services/article-types.service';
import { SeoService } from '../../shared/services/seo.service';
import { Article, ArticleType } from '../../shared/models/article.model';
import { PaginatedArticles } from '../../shared/models/article.model';

// ─── Données de test ───────────────────────────────────────────────────────────

const mockArticles: Article[] = [
  {
    id: 1,
    title: 'Article 1',
    slug: 'article-1',
    typeId: 1,
    userId: 1,
    featured: true,
    type: { id: 1, name: 'Actualité', createdAt: '2026-03-18T00:00:00Z', updatedAt: '2026-03-18T00:00:00Z' },
    createdAt: '2026-03-18T00:00:00Z',
    updatedAt: '2026-03-18T00:00:00Z',
    content: '',
    published: true,
  },
  {
    id: 2,
    title: 'Article 2',
    slug: 'article-2',
    typeId: 4,
    userId: 1,
    featured: true,
    type: { id: 4, name: 'eSport', createdAt: '2026-03-18T00:00:00Z', updatedAt: '2026-03-18T00:00:00Z' },
    createdAt: '2026-03-18T00:00:00Z',
    updatedAt: '2026-03-18T00:00:00Z',
    content: '',
    published: true,
  },
  {
    id: 3,
    title: 'Article 3',
    slug: 'article-3',
    typeId: 1,
    userId: 1,
    featured: true,
    type: { id: 1, name: 'Actualité', createdAt: '2026-03-18T00:00:00Z', updatedAt: '2026-03-18T00:00:00Z' },
    createdAt: '2026-03-18T00:00:00Z',
    updatedAt: '2026-03-18T00:00:00Z',
    content: '',
    published: true,
  },
  {
    id: 4,
    title: 'Article 4',
    slug: 'article-4',
    typeId: 3,
    userId: 1,
    featured: false,
    type: { id: 3, name: 'Match Report', createdAt: '2026-03-18T00:00:00Z', updatedAt: '2026-03-18T00:00:00Z' },
    createdAt: '2026-03-18T00:00:00Z',
    updatedAt: '2026-03-18T00:00:00Z',
    content: '',
    published: true,
  },
  {
    id: 5,
    title: 'Article 5',
    slug: 'article-5',
    typeId: 2,
    userId: 1,
    featured: false,
    type: { id: 2, name: 'Annonce', createdAt: '2026-03-18T00:00:00Z', updatedAt: '2026-03-18T00:00:00Z' },
    createdAt: '2026-03-18T00:00:00Z',
    updatedAt: '2026-03-18T00:00:00Z',
    content: '',
    published: true,
  },
];

const mockTypes: ArticleType[] = [
  { id: 1, name: 'Actualité', createdAt: '2026-03-18T00:00:00Z', updatedAt: '2026-03-18T00:00:00Z' },
  { id: 2, name: 'Annonce', createdAt: '2026-03-18T00:00:00Z', updatedAt: '2026-03-18T00:00:00Z' },
  { id: 3, name: 'Match Report', createdAt: '2026-03-18T00:00:00Z', updatedAt: '2026-03-18T00:00:00Z' },
  { id: 4, name: 'eSport', createdAt: '2026-03-18T00:00:00Z', updatedAt: '2026-03-18T00:00:00Z' },
  { id: 5, name: 'Interview', createdAt: '2026-03-18T00:00:00Z', updatedAt: '2026-03-18T00:00:00Z' }, // aucun article → doit être masqué
];

/** Réponse paginée avec 5 articles (les 3 featured inclus) */
function makePaginatedResponse(articles: Article[]): PaginatedArticles {
  return {
    data: articles,
    meta: { total: articles.length, page: 1, limit: 9, totalPages: 1 },
  };
}

/** Réponse paginée pour les featured (3 premiers articles) */
const featuredResponse = makePaginatedResponse(mockArticles.filter(a => a.featured));

/** Réponse paginée pour le chargement initial (tous les 5 articles) */
const allArticlesResponse = makePaginatedResponse(mockArticles);

// ─── Helper : configure les spies avec les réponses par défaut ─────────────────

function setupDefaultSpies(
  articlesService: jasmine.SpyObj<ArticlesService>,
  articleTypesService: jasmine.SpyObj<ArticleTypesService>,
): void {
  articlesService.getArticles.and.callFake((params?: { featured?: boolean }) => {
    if (params?.featured === true) {
      return of(featuredResponse);
    }
    return of(allArticlesResponse);
  });
  articleTypesService.getArticleTypes.and.returnValue(of(mockTypes));
}

// ─── Suite de tests ────────────────────────────────────────────────────────────

describe('ArticlesPageComponent', () => {
  let component: ArticlesPageComponent;
  let fixture: ComponentFixture<ArticlesPageComponent>;
  let articlesService: jasmine.SpyObj<ArticlesService>;
  let articleTypesService: jasmine.SpyObj<ArticleTypesService>;
  let seoService: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    const articlesServiceSpy = jasmine.createSpyObj('ArticlesService', ['getArticles']);
    const articleTypesServiceSpy = jasmine.createSpyObj('ArticleTypesService', ['getArticleTypes']);
    const seoServiceSpy = jasmine.createSpyObj('SeoService', [
      'updateMetaTags',
      'clearJsonLd',
      'setJsonLd',
    ]);

    setupDefaultSpies(articlesServiceSpy, articleTypesServiceSpy);

    await TestBed.configureTestingModule({
      imports: [ArticlesPageComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: LOCALE_ID, useValue: 'fr' },
        { provide: ArticlesService, useValue: articlesServiceSpy },
        { provide: ArticleTypesService, useValue: articleTypesServiceSpy },
        { provide: SeoService, useValue: seoServiceSpy },
      ],
    }).compileComponents();

    articlesService = TestBed.inject(ArticlesService) as jasmine.SpyObj<ArticlesService>;
    articleTypesService = TestBed.inject(ArticleTypesService) as jasmine.SpyObj<ArticleTypesService>;
    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;

    fixture = TestBed.createComponent(ArticlesPageComponent);
    component = fixture.componentInstance;
  });

  // ─── 1. Création du composant ──────────────────────────────────────────────

  describe('Création', () => {
    it('doit créer le composant', () => {
      expect(component).toBeTruthy();
    });

    it('doit appeler seoService.updateMetaTags au ngOnInit', () => {
      fixture.detectChanges();
      expect(seoService.updateMetaTags).toHaveBeenCalledWith(
        jasmine.objectContaining({ title: 'Actualités' }),
      );
    });

    it('doit appeler seoService.updateMetaTags et clearJsonLd au ngOnDestroy', () => {
      fixture.detectChanges();
      component.ngOnDestroy();
      expect(seoService.updateMetaTags).toHaveBeenCalledWith({});
      expect(seoService.clearJsonLd).toHaveBeenCalled();
    });
  });

  // ─── 2. Signaux calculés : distribution Hero / Duo / Grid ─────────────────

  describe('heroArticle et duoArticles — vue "Tous" (3 featured + 2 réguliers)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('heroArticle doit être le premier article featured', () => {
      expect(component['heroArticle']()).toEqual(mockArticles[0]);
    });

    it('duoArticles doit contenir les featured[1] et featured[2]', () => {
      expect(component['duoArticles']()).toEqual([mockArticles[1], mockArticles[2]]);
    });

    it('regularArticles doit contenir uniquement les articles non-featured', () => {
      const regular = component['regularArticles']();
      expect(regular).toHaveSize(2);
      expect(regular).toContain(mockArticles[3]);
      expect(regular).toContain(mockArticles[4]);
    });

    it('regularArticles ne doit pas contenir les articles featured', () => {
      const regular = component['regularArticles']();
      const regularIds = regular.map(a => a.id);
      expect(regularIds).not.toContain(1);
      expect(regularIds).not.toContain(2);
      expect(regularIds).not.toContain(3);
    });
  });

  describe('heroArticle et duoArticles — vue filtrée avec 2 featured correspondants', () => {
    beforeEach(() => {
      // Filtre sur typeId=1 (Actualité) : featured[0] (id=1) et featured[2] (id=3) correspondent
      articlesService.getArticles.and.callFake((params?: { featured?: boolean; typeId?: number }) => {
        if (params?.featured === true) {
          return of(featuredResponse);
        }
        const filtered = mockArticles.filter(a => !a.featured && a.typeId === 1);
        return of(makePaginatedResponse(filtered));
      });

      fixture.detectChanges();
      component['selectType'](1);
    });

    it('heroArticle doit être null quand exactement 2 featured correspondent', () => {
      // typeId=1 a 2 featured (id=1 et id=3) → duoArticles layout, pas de hero
      expect(component['heroArticle']()).toBeNull();
    });

    it('duoArticles doit contenir les 2 featured correspondant au type', () => {
      const duo = component['duoArticles']();
      expect(duo).toHaveSize(2);
      const duoIds = duo.map(a => a.id);
      expect(duoIds).toContain(1);
      expect(duoIds).toContain(3);
    });
  });

  describe('heroArticle et duoArticles — vue filtrée avec 1 featured correspondant', () => {
    beforeEach(() => {
      // Filtre sur typeId=4 (eSport) : seul featured[1] (id=2) correspond
      articlesService.getArticles.and.callFake((params?: { featured?: boolean; typeId?: number }) => {
        if (params?.featured === true) {
          return of(featuredResponse);
        }
        const filtered = mockArticles.filter(a => !a.featured && a.typeId === 4);
        return of(makePaginatedResponse(filtered));
      });

      fixture.detectChanges();
      component['selectType'](4);
    });

    it('heroArticle doit être l\'unique featured correspondant', () => {
      expect(component['heroArticle']()).toEqual(mockArticles[1]);
    });

    it('duoArticles doit être vide', () => {
      expect(component['duoArticles']()).toEqual([]);
    });
  });

  describe('heroArticle et duoArticles — vue filtrée avec 0 featured correspondant', () => {
    beforeEach(() => {
      // Filtre sur typeId=2 (Annonce) : aucun featured ne correspond
      articlesService.getArticles.and.callFake((params?: { featured?: boolean; typeId?: number }) => {
        if (params?.featured === true) {
          return of(featuredResponse);
        }
        const filtered = mockArticles.filter(a => !a.featured && a.typeId === 2);
        return of(makePaginatedResponse(filtered));
      });

      fixture.detectChanges();
      component['selectType'](2);
    });

    it('heroArticle doit être null quand aucun featured ne correspond', () => {
      expect(component['heroArticle']()).toBeNull();
    });

    it('duoArticles doit être vide', () => {
      expect(component['duoArticles']()).toEqual([]);
    });
  });

  // ─── 3. activeTypes — boutons de filtre stables ────────────────────────────

  describe('activeTypes — boutons de filtre stables', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('doit inclure uniquement les types ayant au moins un article', () => {
      const activeIds = component['activeTypes']().map(t => t.id);
      expect(activeIds).toContain(1); // Actualité : articles 1, 3
      expect(activeIds).toContain(2); // Annonce : article 5
      expect(activeIds).toContain(3); // Match Report : article 4
      expect(activeIds).toContain(4); // eSport : article 2
    });

    it('doit exclure le type sans article (Interview, id=5)', () => {
      const activeIds = component['activeTypes']().map(t => t.id);
      expect(activeIds).not.toContain(5);
    });

    it('doit rester stable après changement de filtre (basé sur initialArticles)', () => {
      // Appliquer un filtre
      articlesService.getArticles.and.callFake((params?: { featured?: boolean }) => {
        if (params?.featured === true) return of(featuredResponse);
        // Simuler une réponse filtrée ne contenant que des articles de type 1
        return of(makePaginatedResponse(mockArticles.filter(a => a.typeId === 1)));
      });

      component['selectType'](1);

      // activeTypes doit toujours afficher tous les types ayant des articles
      // car il se base sur allKnownArticles (featured + initialArticles)
      const activeIds = component['activeTypes']().map(t => t.id);
      expect(activeIds).toContain(2);
      expect(activeIds).toContain(3);
      expect(activeIds).toContain(4);
      expect(activeIds).not.toContain(5);
    });
  });

  // ─── 4. typeArticleCounts — comptage par type ──────────────────────────────

  describe('typeArticleCounts — comptage des articles par type', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('doit compter correctement le type Actualité (id=1) : 2 articles (featured 1 et 3)', () => {
      // Articles avec typeId=1 : id=1 (featured), id=3 (featured)
      // Article id=1 et id=3 sont dans featuredArticles
      // allKnownArticles = union(featured[1,2,3], initialArticles[1,2,3,4,5])
      // typeId=1 : articles id=1 et id=3 → 2
      const count = component['typeArticleCounts']().get(1);
      expect(count).toBe(2);
    });

    it('doit compter correctement le type Annonce (id=2) : 1 article (id=5)', () => {
      const count = component['typeArticleCounts']().get(2);
      expect(count).toBe(1);
    });

    it('doit compter correctement le type Match Report (id=3) : 1 article (id=4)', () => {
      const count = component['typeArticleCounts']().get(3);
      expect(count).toBe(1);
    });

    it('doit compter correctement le type eSport (id=4) : 1 article (id=2)', () => {
      const count = component['typeArticleCounts']().get(4);
      expect(count).toBe(1);
    });

    it('doit retourner undefined pour un type sans article (Interview, id=5)', () => {
      const count = component['typeArticleCounts']().get(5);
      expect(count).toBeUndefined();
    });

    it('doit dédupliquer les articles présents à la fois dans featured et initialArticles', () => {
      // Les articles 1, 2, 3 sont dans featuredArticles ET dans allArticlesResponse
      // Le total unique doit être 5 (pas 8 = 3 + 5)
      let total = 0;
      component['typeArticleCounts']().forEach(count => (total += count));
      expect(total).toBe(5);
    });
  });

  // ─── 5. visibleFeatured ────────────────────────────────────────────────────

  describe('visibleFeatured', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('sans filtre : doit retourner tous les featured', () => {
      expect(component['visibleFeatured']()).toHaveSize(3);
    });

    it('avec filtre typeId=1 : doit retourner uniquement les featured de ce type', () => {
      articlesService.getArticles.and.callFake((params?: { featured?: boolean }) => {
        if (params?.featured === true) return of(featuredResponse);
        return of(allArticlesResponse);
      });
      component['selectType'](1);

      const visible = component['visibleFeatured']();
      expect(visible).toHaveSize(2);
      visible.forEach(a => expect(a.typeId).toBe(1));
    });

    it('avec filtre typeId=3 : doit retourner un tableau vide (aucun featured de ce type)', () => {
      articlesService.getArticles.and.callFake((params?: { featured?: boolean }) => {
        if (params?.featured === true) return of(featuredResponse);
        return of(allArticlesResponse);
      });
      component['selectType'](3);

      expect(component['visibleFeatured']()).toEqual([]);
    });
  });

  // ─── 6. selectType ────────────────────────────────────────────────────────

  describe('selectType', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('doit mettre à jour selectedTypeId avec le typeId fourni', () => {
      articlesService.getArticles.and.returnValue(of(allArticlesResponse));
      component['selectType'](2);
      expect(component['selectedTypeId']()).toBe(2);
    });

    it('doit réinitialiser currentPage à 1', () => {
      // Simuler une page différente de 1
      component['currentPage'].set(3);
      articlesService.getArticles.and.returnValue(of(allArticlesResponse));
      component['selectType'](1);
      expect(component['currentPage']()).toBe(1);
    });

    it('doit accepter null pour désélectionner le filtre', () => {
      articlesService.getArticles.and.returnValue(of(allArticlesResponse));
      component['selectType'](2);
      component['selectType'](null);
      expect(component['selectedTypeId']()).toBeNull();
    });

    it('doit déclencher un rechargement des articles', () => {
      const initialCallCount = articlesService.getArticles.calls.count();
      articlesService.getArticles.and.returnValue(of(allArticlesResponse));
      component['selectType'](1);
      // Deux appels supplémentaires : 1 pour featured filtré implicite via loadArticles
      // (loadArticles n'appelle getArticles qu'une fois, sans featured)
      expect(articlesService.getArticles.calls.count()).toBeGreaterThan(initialCallCount);
    });
  });

  // ─── 7. hasContent ────────────────────────────────────────────────────────

  describe('hasContent', () => {
    it('doit être true quand il y a des featured ET des articles réguliers', () => {
      fixture.detectChanges();
      expect(component['hasContent']()).toBeTrue();
    });

    it('doit être true quand il y a uniquement des articles featured', () => {
      // Simuler une réponse sans articles réguliers
      articlesService.getArticles.and.callFake((params?: { featured?: boolean }) => {
        if (params?.featured === true) return of(featuredResponse);
        return of(makePaginatedResponse([]));
      });
      fixture.detectChanges();
      expect(component['hasContent']()).toBeTrue();
    });

    it('doit être true quand il y a uniquement des articles réguliers (non featured)', () => {
      // Simuler aucun featured
      articlesService.getArticles.and.callFake((params?: { featured?: boolean }) => {
        if (params?.featured === true) return of(makePaginatedResponse([]));
        return of(makePaginatedResponse([mockArticles[3], mockArticles[4]]));
      });
      fixture.detectChanges();
      expect(component['hasContent']()).toBeTrue();
    });

    it('doit être false quand featured et réguliers sont tous deux vides', () => {
      articlesService.getArticles.and.callFake((params?: { featured?: boolean }) => {
        if (params?.featured === true) return of(makePaginatedResponse([]));
        return of(makePaginatedResponse([]));
      });
      fixture.detectChanges();
      expect(component['hasContent']()).toBeFalse();
    });
  });

  // ─── 8. Chargement initial ────────────────────────────────────────────────

  describe('Chargement initial', () => {
    it('doit passer loading à false après chargement réussi', () => {
      fixture.detectChanges();
      expect(component['loading']()).toBeFalse();
    });

    it('doit définir totalPages depuis la réponse paginée', () => {
      articlesService.getArticles.and.callFake((params?: { featured?: boolean }) => {
        if (params?.featured === true) return of(featuredResponse);
        return of({
          data: mockArticles,
          meta: { total: 50, page: 1, limit: 9, totalPages: 6 },
        });
      });
      fixture.detectChanges();
      expect(component['totalPages']()).toBe(6);
    });

    it('doit définir totalItems depuis la réponse paginée', () => {
      articlesService.getArticles.and.callFake((params?: { featured?: boolean }) => {
        if (params?.featured === true) return of(featuredResponse);
        return of({
          data: mockArticles,
          meta: { total: 42, page: 1, limit: 9, totalPages: 5 },
        });
      });
      fixture.detectChanges();
      expect(component['totalItems']()).toBe(42);
    });

    it('doit passer loading à false même si les services retournent une erreur (catchError interne)', () => {
      // Le composant utilise catchError(() => of(null)) sur chaque observable du forkJoin
      // → les erreurs individuelles sont silencieusement absorbées, loading passe à false
      articlesService.getArticles.and.returnValue(throwError(() => new Error('Network error')));
      articleTypesService.getArticleTypes.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();
      expect(component['loading']()).toBeFalse();
    });
  });

  // ─── 9. getTypeCount ──────────────────────────────────────────────────────

  describe('getTypeCount', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('doit retourner le bon compte pour un type existant', () => {
      expect(component['getTypeCount'](1)).toBe(2);
      expect(component['getTypeCount'](2)).toBe(1);
    });

    it('doit retourner 0 pour un type sans article', () => {
      expect(component['getTypeCount'](5)).toBe(0);
      expect(component['getTypeCount'](999)).toBe(0);
    });
  });

  // ─── 10. getImageUrl ──────────────────────────────────────────────────────

  describe('getImageUrl', () => {
    it('doit retourner imageUrl si défini', () => {
      const article: Article = { ...mockArticles[0], imageUrl: 'assets/custom.jpg' };
      expect(component['getImageUrl'](article)).toBe('assets/custom.jpg');
    });

    it('doit retourner l\'image par défaut si imageUrl est absent', () => {
      const article: Article = { ...mockArticles[0], imageUrl: undefined };
      expect(component['getImageUrl'](article)).toBe('assets/img/home/img1.png');
    });
  });
});
