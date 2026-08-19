import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, WritableSignal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { ArticleCategoriesPageComponent } from './article-categories-page.component';
import { ArticleCategoryDialogComponent } from './article-category-dialog.component';
import { ArticleTypesService } from '../../../../shared/services/article-types.service';
import { AdminConfirmService } from '../../../shared/admin-confirm.service';
import { AdminDialogService } from '../../../shared/admin-dialog.service';
import { AdminNotifier } from '../../../shared/admin-notifier.service';
import type { ArticleType } from '../../../../shared/models/article.model';

describe('ArticleCategoriesPageComponent', () => {
  let fixture: ComponentFixture<ArticleCategoriesPageComponent>;
  let component: ArticleCategoriesPageComponent;
  let typesService: jasmine.SpyObj<ArticleTypesService>;
  let confirm: jasmine.SpyObj<AdminConfirmService>;
  let adminDialog: jasmine.SpyObj<AdminDialogService>;
  let notifier: jasmine.SpyObj<AdminNotifier>;
  let router: jasmine.SpyObj<Router>;
  let types: WritableSignal<ArticleType[]>;

  const actualites = {
    id: 1,
    name: 'Actualités',
    createdAt: '2026-01-01T00:00:00.000Z',
  } as unknown as ArticleType;

  const tutoriels = {
    id: 2,
    name: 'Tutoriels',
    createdAt: '2026-02-01T00:00:00.000Z',
  } as unknown as ArticleType;

  /** Reference de dialogue minimale : seul `afterClosed()` est consomme. */
  function dialogRef(result: unknown) {
    return { afterClosed: () => of(result) } as never;
  }

  async function setup(initial: ArticleType[] = [actualites, tutoriels]): Promise<void> {
    // Deux cas remontent la page sur un jeu de donnees different a l'interieur
    // d'un `describe` deja configure : sans remise a zero, TestBed refuse.
    TestBed.resetTestingModule();
    types = signal<ArticleType[]>(initial);

    const typesSpy = jasmine.createSpyObj<ArticleTypesService>(
      'ArticleTypesService',
      ['getArticleTypes', 'deleteArticleType'],
      { allTypes: types },
    );
    const confirmSpy = jasmine.createSpyObj('AdminConfirmService', ['delete']);
    const adminDialogSpy = jasmine.createSpyObj('AdminDialogService', ['open']);
    const notifierSpy = jasmine.createSpyObj('AdminNotifier', [
      'success',
      'error',
      'saved',
      'deleted',
      'info',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    typesSpy.getArticleTypes.and.returnValue(of(initial));
    typesSpy.deleteArticleType.and.returnValue(of(undefined));
    confirmSpy.delete.and.returnValue(of(true));
    adminDialogSpy.open.and.returnValue(dialogRef(true));
    routerSpy.navigate.and.returnValue(Promise.resolve(true));

    await TestBed.configureTestingModule({
      imports: [ArticleCategoriesPageComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ArticleTypesService, useValue: typesSpy },
        { provide: AdminConfirmService, useValue: confirmSpy },
        { provide: AdminDialogService, useValue: adminDialogSpy },
        { provide: AdminNotifier, useValue: notifierSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    typesService = TestBed.inject(ArticleTypesService) as jasmine.SpyObj<ArticleTypesService>;
    confirm = TestBed.inject(AdminConfirmService) as jasmine.SpyObj<AdminConfirmService>;
    adminDialog = TestBed.inject(AdminDialogService) as jasmine.SpyObj<AdminDialogService>;
    notifier = TestBed.inject(AdminNotifier) as jasmine.SpyObj<AdminNotifier>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(ArticleCategoriesPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  // ─── Chargement ────────────────────────────────────────────────────────────

  describe('chargement', () => {
    beforeEach(async () => {
      await setup();
    });

    it('charge les catégories au montage', () => {
      expect(typesService.getArticleTypes).toHaveBeenCalled();
      expect(component.loading()).toBeFalse();
      expect(component.loadError()).toBeUndefined();
    });

    it('rend le tableau des catégories', () => {
      const rows = el().querySelectorAll('table.categories-table tr[mat-row]');
      expect(rows).toHaveSize(2);
      expect(el().textContent).toContain('Actualités');
      expect(el().textContent).toContain('Tutoriels');
    });

    it('porte un en-tête de page avec bouton de retour et compteur', () => {
      expect(el().querySelector('.page-header h1')?.textContent).toContain("Catégories d'articles");
      expect(el().querySelector('.page-header .back-button')).toBeTruthy();
      expect(el().querySelector('[data-testid="page-count"]')?.textContent).toContain(
        '2 catégories',
      );
    });

    it("n'est plus monté dans un dialogue : aucun markup de modale", () => {
      // C'etait le seul dialogue-dans-un-dialogue du panel. La de-imbrication
      // se verifie ici : plus de titre ni de pied de dialogue, plus de bouton
      // « Fermer » — la page se quitte par le bouton de retour.
      expect(el().querySelector('[mat-dialog-title]')).toBeNull();
      expect(el().querySelector('mat-dialog-content')).toBeNull();
      expect(el().querySelector('mat-dialog-actions')).toBeNull();
      expect(el().querySelector('[mat-dialog-close]')).toBeNull();
    });

    it('affiche un état vide quand aucune catégorie n’existe', async () => {
      await setup([]);
      expect(el().querySelector('.empty-state')).toBeTruthy();
      expect(el().querySelector('.error-state')).toBeNull();
      expect(el().textContent).toContain('Aucune catégorie');
    });
  });

  // ─── Erreur de chargement ──────────────────────────────────────────────────

  describe('erreur de chargement', () => {
    beforeEach(async () => {
      await setup();
      typesService.getArticleTypes.and.returnValue(throwError(() => new Error('boom')));
      component.loadCategories();
      await settle();
    });

    it('affiche un bandeau bloquant et non un état vide', () => {
      // Le dialogue affichait un snackbar de 3 secondes puis son etat vide :
      // passe le delai, une panne d'API se lisait « Aucune categorie creee ».
      expect(component.loadError()).toBe('Impossible de charger les catégories.');
      expect(el().querySelector('.error-state')).toBeTruthy();
      expect(el().querySelector('.empty-state')).toBeNull();
      expect(el().querySelector('table.categories-table')).toBeNull();
    });

    it('propose un réessai qui relance le chargement', async () => {
      const retry = el().querySelector<HTMLButtonElement>('[data-testid="error-retry"]');
      expect(retry).toBeTruthy();

      typesService.getArticleTypes.and.returnValue(of([actualites]));
      retry!.click();
      await settle();

      expect(component.loadError()).toBeUndefined();
      expect(el().querySelector('table.categories-table')).toBeTruthy();
    });

    it('masque le compteur et désactive la création tant que l’erreur dure', () => {
      expect(el().querySelector('[data-testid="page-count"]')).toBeNull();
      const create = el().querySelector<HTMLButtonElement>(
        'button[aria-label="Créer une nouvelle catégorie"]',
      );
      expect(create?.disabled).toBeTrue();
    });
  });

  // ─── Création et édition ───────────────────────────────────────────────────

  describe('formulaire de catégorie', () => {
    beforeEach(async () => {
      await setup();
    });

    it('ouvre le formulaire de création en dialogue `sm`, sans catégorie', () => {
      component.openCreateDialog();

      expect(adminDialog.open).toHaveBeenCalledWith(ArticleCategoryDialogComponent, 'sm', {
        category: undefined,
      });
      expect(notifier.saved).toHaveBeenCalledWith('Catégorie', 'create', 'f');
    });

    it('ouvre le formulaire d’édition avec la catégorie visée', () => {
      component.openEditDialog(tutoriels);

      expect(adminDialog.open).toHaveBeenCalledWith(ArticleCategoryDialogComponent, 'sm', {
        category: tutoriels,
      });
      expect(notifier.saved).toHaveBeenCalledWith('Catégorie', 'edit', 'f');
    });

    it('ne notifie rien quand le formulaire est fermé sans enregistrer', () => {
      adminDialog.open.and.returnValue(dialogRef(undefined));

      component.openCreateDialog();

      expect(notifier.saved).not.toHaveBeenCalled();
    });

    it('déclenche la création depuis l’état vide', async () => {
      await setup([]);
      el().querySelector<HTMLButtonElement>('[data-testid="empty-action"]')!.click();

      expect(adminDialog.open).toHaveBeenCalledWith(
        ArticleCategoryDialogComponent,
        'sm',
        jasmine.objectContaining({ category: undefined }),
      );
    });
  });

  // ─── Suppression ───────────────────────────────────────────────────────────

  describe('suppression', () => {
    beforeEach(async () => {
      await setup();
    });

    it('demande confirmation puis supprime', () => {
      component.confirmDelete(actualites);

      expect(confirm.delete).toHaveBeenCalledWith('la catégorie', 'Actualités');
      expect(typesService.deleteArticleType).toHaveBeenCalledWith(1);
      expect(notifier.deleted).toHaveBeenCalledWith('Catégorie', 'f');
    });

    it('ne supprime rien si la confirmation est refusée', () => {
      confirm.delete.and.returnValue(of(false));

      component.confirmDelete(actualites);

      expect(typesService.deleteArticleType).not.toHaveBeenCalled();
    });

    it('conserve le message de refus sur une catégorie utilisée (409)', () => {
      typesService.deleteArticleType.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 409 })),
      );

      component.confirmDelete(actualites);

      expect(notifier.error).toHaveBeenCalledWith(
        'Impossible de supprimer : des articles utilisent cette catégorie',
      );
      expect(notifier.deleted).not.toHaveBeenCalled();
    });

    it('signale les autres échecs de suppression', () => {
      typesService.deleteArticleType.and.returnValue(
        throwError(() => new HttpErrorResponse({ status: 500 })),
      );

      component.confirmDelete(actualites);

      expect(notifier.error).toHaveBeenCalledWith('Erreur lors de la suppression');
    });
  });

  // ─── Navigation ────────────────────────────────────────────────────────────

  describe('navigation', () => {
    beforeEach(async () => {
      await setup();
    });

    it('revient à la liste des articles', () => {
      component.backToArticles();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/articles']);
    });

    it('câble le bouton de retour de l’en-tête', () => {
      el().querySelector<HTMLButtonElement>('.back-button')!.click();
      expect(router.navigate).toHaveBeenCalledWith(['/admin/articles']);
    });
  });
});
