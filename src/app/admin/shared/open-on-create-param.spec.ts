import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { openOnCreateParam } from './open-on-create-param';

describe('openOnCreateParam', () => {
  let queryParamMap: BehaviorSubject<ParamMap>;
  let router: jasmine.SpyObj<Router>;
  let open: jasmine.Spy;

  /** Monte le helper avec les paramètres d'URL fournis. */
  function mount(params: Record<string, string>): void {
    queryParamMap = new BehaviorSubject<ParamMap>(convertToParamMap(params));
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    open = jasmine.createSpy('open');

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParamMap.asObservable() } },
      ],
    });

    TestBed.runInInjectionContext(() => openOnCreateParam(open));
  }

  /** Laisse passer la microtache de differe. */
  const flush = () => Promise.resolve();

  afterEach(() => TestBed.resetTestingModule());

  it('ouvre le formulaire quand l’URL le demande', async () => {
    mount({ nouveau: '1' });
    await flush();
    expect(open).toHaveBeenCalled();
  });

  it('n’ouvre pas avant la fin de l’initialisation du composant', () => {
    // `queryParamMap` emet des l'abonnement : ouvrir tout de suite lirait des
    // dependances pas encore injectees dans la classe appelante.
    mount({ nouveau: '1' });
    expect(open).not.toHaveBeenCalled();
  });

  it('n’ouvre rien sans le paramètre', async () => {
    mount({});
    await flush();
    expect(open).not.toHaveBeenCalled();
  });

  it('ignore une valeur inattendue', async () => {
    mount({ nouveau: 'oui' });
    await flush();
    expect(open).not.toHaveBeenCalled();
  });

  it('retire le paramètre de l’URL', () => {
    // Sans ce nettoyage, un rafraichissement ou un retour arriere rouvrirait le
    // formulaire, et un lien copie-colle le rouvrirait chez le destinataire.
    mount({ nouveau: '1' });

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({ queryParams: {}, replaceUrl: true })
    );
  });

  it('rouvre le formulaire si la palette est réutilisée sur la même page', async () => {
    mount({});
    queryParamMap.next(convertToParamMap({ nouveau: '1' }));
    await flush();
    expect(open).toHaveBeenCalledTimes(1);
  });
});
