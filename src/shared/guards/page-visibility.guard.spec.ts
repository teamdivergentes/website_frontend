import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RedirectCommand,
  Router,
  RouterStateSnapshot,
  provideRouter,
} from '@angular/router';

import { pageVisibilityGuard } from './page-visibility.guard';
import { PageVisibilityService } from '../services/page-visibility.service';

describe('pageVisibilityGuard', () => {
  let pageVisibilitySpy: jasmine.SpyObj<PageVisibilityService>;

  function setup() {
    pageVisibilitySpy = jasmine.createSpyObj('PageVisibilityService', ['isPageVisible']);

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: PageVisibilityService, useValue: pageVisibilitySpy },
      ],
    });
  }

  /** Exécute le guard dans un contexte d'injection, comme le fait le routeur. */
  function run(data: Record<string, unknown>) {
    const route = { data } as unknown as ActivatedRouteSnapshot;
    const state = { url: '/structure/palmares' } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(() => pageVisibilityGuard(route, state));
  }

  beforeEach(() => setup());

  it('laisse passer quand la page est visible', () => {
    pageVisibilitySpy.isPageVisible.and.returnValue(true);

    expect(run({ visibilityPath: '/structure/palmares' })).toBeTrue();
  });

  it('interroge le service avec le chemin déclaré dans data', () => {
    pageVisibilitySpy.isPageVisible.and.returnValue(true);

    run({ visibilityPath: '/structure/palmares' });

    expect(pageVisibilitySpy.isPageVisible).toHaveBeenCalledOnceWith('/structure/palmares');
  });

  it('rend la 404 quand la page est masquée', () => {
    pageVisibilitySpy.isPageVisible.and.returnValue(false);

    const result = run({ visibilityPath: '/structure/palmares' });

    expect(result instanceof RedirectCommand).toBeTrue();
  });

  it("préserve l'URL d'origine — la 404 est rendue sans redirection visible", () => {
    pageVisibilitySpy.isPageVisible.and.returnValue(false);

    const result = run({ visibilityPath: '/structure/palmares' }) as RedirectCommand;

    expect(result.navigationBehaviorOptions?.skipLocationChange).toBeTrue();
  });

  it('cible bien la route 404', () => {
    pageVisibilitySpy.isPageVisible.and.returnValue(false);
    const router = TestBed.inject(Router);

    const result = run({ visibilityPath: '/structure/palmares' }) as RedirectCommand;

    expect(router.serializeUrl(result.redirectTo)).toBe('/404');
  });

  it("laisse passer sans interroger le service quand la route ne déclare pas de chemin", () => {
    expect(run({})).toBeTrue();
    expect(pageVisibilitySpy.isPageVisible).not.toHaveBeenCalled();
  });
});
