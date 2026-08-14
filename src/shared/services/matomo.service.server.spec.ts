import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';

import { MatomoService } from './matomo.service';
import { RuntimeConfigService } from './runtime-config.service';

type GlobalWithPaq = { _paq?: unknown[][] };

/**
 * EPIC-29 — le rendu serveur ne doit charger aucun traceur : `document` n'existe
 * pas cote Node et l'injection de script ferait echouer le SSR sur toutes les
 * pages publiques.
 */
describe('MatomoService — rendu serveur', () => {
  let runtimeConfigSpy: jasmine.SpyObj<RuntimeConfigService>;
  let appendSpy: jasmine.Spy;

  function setup(platform: 'server' | 'browser'): MatomoService {
    runtimeConfigSpy = jasmine.createSpyObj<RuntimeConfigService>('RuntimeConfigService', ['load']);
    runtimeConfigSpy.load.and.resolveTo(undefined);
    Object.defineProperty(runtimeConfigSpy, 'matomoUrl', {
      get: () => 'https://matomo.example.com',
      configurable: true,
    });
    Object.defineProperty(runtimeConfigSpy, 'matomoSiteId', { get: () => '1', configurable: true });

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        MatomoService,
        { provide: PLATFORM_ID, useValue: platform },
        { provide: RuntimeConfigService, useValue: runtimeConfigSpy },
        { provide: Router, useValue: { events: new Subject<NavigationEnd>().asObservable() } },
      ],
    });

    return TestBed.inject(MatomoService);
  }

  beforeEach(() => {
    appendSpy = spyOn(document.head, 'appendChild').and.callFake(<T extends Node>(node: T): T => {
      if (node instanceof HTMLScriptElement && node.src.includes('matomo.js')) {
        return node;
      }
      return Element.prototype.appendChild.call(document.head, node) as T;
    });
  });

  afterEach(() => {
    delete (globalThis as GlobalWithPaq)._paq;
  });

  it("n'injecte aucun script et ne lit meme pas la config", async () => {
    const service = setup('server');

    await service.init();

    expect(runtimeConfigSpy.load).not.toHaveBeenCalled();
    expect(appendSpy).not.toHaveBeenCalled();
    expect((globalThis as GlobalWithPaq)._paq).toBeUndefined();
  });

  it('ne suit aucune page vue tant que init() a ete court-circuite', async () => {
    const service = setup('server');
    await service.init();

    service.trackPageView('/articles/mon-article');

    expect((globalThis as GlobalWithPaq)._paq).toBeUndefined();
  });

  it('injecte bien le script cote navigateur — branche nominale', async () => {
    const service = setup('browser');

    await service.init();

    expect(runtimeConfigSpy.load).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect((globalThis as GlobalWithPaq)._paq).toBeDefined();
  });
});
