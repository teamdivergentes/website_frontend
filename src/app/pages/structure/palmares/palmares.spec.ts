import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, NEVER, throwError } from 'rxjs';
import { PalmaresComponent } from './palmares';
import { TrophiesService } from '../../../shared/services/trophies.service';
import { GamesService } from '../../../shared/services/games.service';
import { SeoService } from '../../../shared/services/seo.service';
import { Trophy } from '../../../shared/models/trophy.model';
import { Game } from '../../../shared/models/game.model';

// =============================================================================
// Fixtures partagées
// =============================================================================

const TROPHY_FEATURED_2025: Trophy = {
  id: 1,
  competition: 'Coupe de France LoL',
  placement: 1,
  description: 'Victoire en finale',
  date: '2025-06-15T00:00:00.000Z',
  image: null,
  featured: true,
  teamId: 2,
  teamName: 'Équipe LoL',
  teamSlug: 'equipe-lol',
  teamGame: 'lol',
};

const TROPHY_FEATURED_2024: Trophy = {
  id: 2,
  competition: 'Championnat Valorant',
  placement: 2,
  description: 'Finaliste',
  date: '2024-11-10T00:00:00.000Z',
  image: null,
  featured: true,
  teamId: 3,
  teamName: 'Équipe Val',
  teamSlug: 'equipe-val',
  teamGame: 'valorant',
};

const TROPHY_NON_FEATURED: Trophy = {
  id: 3,
  competition: 'LAN Winter Cup',
  placement: 3,
  date: '2024-03-01T00:00:00.000Z',
  image: null,
  featured: false,
  teamId: null,
  teamName: null,
  teamSlug: null,
  teamGame: null,
};

const MOCK_GAMES: Game[] = [
  {
    id: 1, name: 'League of Legends', key: 'lol', active: true, position: 0,
    image: '/img/lol.png', createdAt: '', updatedAt: '',
  },
  {
    id: 2, name: 'Valorant', key: 'valorant', active: true, position: 1,
    image: '/img/valorant.png', createdAt: '', updatedAt: '',
  },
];

// =============================================================================
// Helpers
// =============================================================================

function buildTrophiesSpy(trophies: Trophy[]): jasmine.SpyObj<TrophiesService> {
  const featured = trophies.filter(t => t.featured);
  const byYear = (() => {
    const map = new Map<number, Trophy[]>();
    for (const t of trophies) {
      const y = new Date(t.date).getFullYear();
      map.set(y, [...(map.get(y) ?? []), t]);
    }
    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, ts]) => ({ year, trophies: ts }));
  })();

  return jasmine.createSpyObj(
    'TrophiesService',
    ['loadTrophies'],
    {
      trophies: signal<Trophy[]>(trophies).asReadonly(),
      featuredTrophies: signal<Trophy[]>(featured).asReadonly(),
      trophiesByYear: signal(byYear).asReadonly(),
    },
  );
}

function buildGamesSpy(): jasmine.SpyObj<GamesService> {
  return jasmine.createSpyObj('GamesService', ['loadActiveGames'], {
    activeGames: jasmine.createSpy().and.returnValue(MOCK_GAMES),
  });
}

function buildSeoSpy(): jasmine.SpyObj<SeoService> {
  const spy = jasmine.createSpyObj('SeoService', [
    'updateMetaTags', 'setJsonLd', 'getBreadcrumbListJsonLd',
  ]);
  spy.getBreadcrumbListJsonLd.and.returnValue({ '@type': 'BreadcrumbList' });
  return spy;
}

// =============================================================================
// Suite principale (trophée featured disponible)
// =============================================================================

describe('PalmaresComponent', () => {
  let fixture: ComponentFixture<PalmaresComponent>;
  let component: PalmaresComponent;
  let trophiesService: jasmine.SpyObj<TrophiesService>;
  let gamesService: jasmine.SpyObj<GamesService>;
  let seoService: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    trophiesService = buildTrophiesSpy([TROPHY_FEATURED_2025]);
    gamesService = buildGamesSpy();
    seoService = buildSeoSpy();

    await TestBed.configureTestingModule({
      imports: [PalmaresComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TrophiesService, useValue: trophiesService },
        { provide: GamesService, useValue: gamesService },
        { provide: SeoService, useValue: seoService },
      ],
    }).compileComponents();

    trophiesService = TestBed.inject(TrophiesService) as jasmine.SpyObj<TrophiesService>;
    gamesService = TestBed.inject(GamesService) as jasmine.SpyObj<GamesService>;
    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;

    trophiesService.loadTrophies.and.returnValue(NEVER);
    gamesService.loadActiveGames.and.returnValue(NEVER);

    fixture = TestBed.createComponent(PalmaresComponent);
    component = fixture.componentInstance;
  });

  // ---------------------------------------------------------------------------
  // Création et SEO
  // ---------------------------------------------------------------------------

  it('devrait créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('configure le SEO au init', () => {
    fixture.detectChanges();
    expect(seoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Palmarès', url: '/structure/palmares' }),
    );
    expect(seoService.setJsonLd).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Chargement
  // ---------------------------------------------------------------------------

  it('charge les trophées et les jeux au init', () => {
    trophiesService.loadTrophies.and.returnValue(of([TROPHY_FEATURED_2025]));
    gamesService.loadActiveGames.and.returnValue(of(MOCK_GAMES));
    fixture.detectChanges();
    expect(trophiesService.loadTrophies).toHaveBeenCalled();
    expect(gamesService.loadActiveGames).toHaveBeenCalled();
    expect(component.loading()).toBeFalse();
  });

  it('skeleton visible pendant le chargement', () => {
    fixture.detectChanges(); // loading = true (NEVER)
    const skeleton = (fixture.nativeElement as HTMLElement).querySelector('.skeleton-hero');
    expect(skeleton).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // heroTrophy — trophée featured le plus récent
  // ---------------------------------------------------------------------------

  it('heroTrophy est le trophée featured disponible', () => {
    // Signaux initialisés avec [TROPHY_FEATURED_2025] dans beforeEach
    expect(component.heroTrophy()?.id).toBe(TROPHY_FEATURED_2025.id);
  });

  it('heroTrophy affiche la compétition et l\'année dans le DOM', () => {
    trophiesService.loadTrophies.and.returnValue(of([TROPHY_FEATURED_2025]));
    gamesService.loadActiveGames.and.returnValue(of(MOCK_GAMES));
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    const competition = el.querySelector('.hero-competition');
    expect(competition).toBeTruthy();
    expect(competition!.textContent).toContain('Coupe de France LoL');

    const watermark = el.querySelector('.hero-year-watermark');
    expect(watermark).toBeTruthy();
    expect(watermark!.textContent?.trim()).toContain('2025');
  });

  it('le hero affiche la compétition, le rang typographique et le nom d\'équipe', () => {
    trophiesService.loadTrophies.and.returnValue(of([TROPHY_FEATURED_2025]));
    gamesService.loadActiveGames.and.returnValue(of(MOCK_GAMES));
    fixture.detectChanges();

    const monument = (fixture.nativeElement as HTMLElement).querySelector('.hero-monument');
    const text = monument?.textContent ?? '';
    expect(text).toContain('Coupe de France LoL');
    // Rang rendu typographiquement (aucun emoji), la teinte podium est CSS
    expect(text).toContain('1er');
    expect(text).toContain('Équipe LoL');

    const placement = monument?.querySelector('.hero-placement');
    expect(placement?.getAttribute('aria-label')).toBe('1re place');
  });

  // ---------------------------------------------------------------------------
  // mosaicTrophies — featured hors hero
  // ---------------------------------------------------------------------------

  it('mosaïque vide si un seul featured', () => {
    expect(component.mosaicTrophies().length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // getGameLogo — logo du jeu
  // ---------------------------------------------------------------------------

  it('getGameLogo retourne l\'image du jeu pour une clé connue', () => {
    expect(component.getGameLogo('lol')).toBe('/img/lol.png');
  });

  it('getGameLogo est insensible à la casse', () => {
    expect(component.getGameLogo('LOL')).toBe('/img/lol.png');
  });

  it('getGameLogo retourne le fallback logoTD.svg pour une clé inconnue', () => {
    expect(component.getGameLogo('unknown')).toContain('logoTD.svg');
  });

  it('getGameLogo retourne le fallback logoTD.svg pour null', () => {
    expect(component.getGameLogo(null)).toContain('logoTD.svg');
  });

  it('getGameLogo retourne le fallback logoTD.svg pour undefined', () => {
    expect(component.getGameLogo(undefined)).toContain('logoTD.svg');
  });

  // ---------------------------------------------------------------------------
  // placementLabel / placementAria
  // ---------------------------------------------------------------------------

  it('placementLabel retourne un rang typographique pour 1-3 et Top n au-delà', () => {
    expect(component.placementLabel(1)).toBe('1er');
    expect(component.placementLabel(2)).toBe('2e');
    expect(component.placementLabel(3)).toBe('3e');
    expect(component.placementLabel(4)).toBe('Top 4');
  });

  // ---------------------------------------------------------------------------
  // Anti-emoji décoratif
  // ---------------------------------------------------------------------------

  it('AUCUN emoji médaille/trophée (🏆🥇🥈🥉) dans le DOM rendu', () => {
    trophiesService.loadTrophies.and.returnValue(of([TROPHY_FEATURED_2025]));
    gamesService.loadActiveGames.and.returnValue(of(MOCK_GAMES));
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('🏆');
    expect(text).not.toContain('🥇');
    expect(text).not.toContain('🥈');
    expect(text).not.toContain('🥉');
  });

  it('le hint rail « glisse pour découvrir » est absent du DOM', () => {
    trophiesService.loadTrophies.and.returnValue(of([TROPHY_FEATURED_2025]));
    gamesService.loadActiveGames.and.returnValue(of(MOCK_GAMES));
    fixture.detectChanges();

    const hint = (fixture.nativeElement as HTMLElement).querySelector('.rail-hint');
    expect(hint).toBeNull();
  });
});

// =============================================================================
// Suite : deux featured (hero + mosaïque)
// =============================================================================

describe('PalmaresComponent — deux featured', () => {
  let fixture: ComponentFixture<PalmaresComponent>;
  let component: PalmaresComponent;
  let trophiesService: jasmine.SpyObj<TrophiesService>;
  let gamesService: jasmine.SpyObj<GamesService>;

  beforeEach(async () => {
    trophiesService = buildTrophiesSpy([TROPHY_FEATURED_2025, TROPHY_FEATURED_2024]);
    gamesService = buildGamesSpy();

    await TestBed.configureTestingModule({
      imports: [PalmaresComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TrophiesService, useValue: trophiesService },
        { provide: GamesService, useValue: gamesService },
        { provide: SeoService, useValue: buildSeoSpy() },
      ],
    }).compileComponents();

    trophiesService = TestBed.inject(TrophiesService) as jasmine.SpyObj<TrophiesService>;
    gamesService = TestBed.inject(GamesService) as jasmine.SpyObj<GamesService>;
    trophiesService.loadTrophies.and.returnValue(NEVER);
    gamesService.loadActiveGames.and.returnValue(NEVER);

    fixture = TestBed.createComponent(PalmaresComponent);
    component = fixture.componentInstance;
  });

  it('heroTrophy est le featured le plus récent (2025 > 2024)', () => {
    expect(component.heroTrophy()?.id).toBe(TROPHY_FEATURED_2025.id);
  });

  it('mosaïque = featured moins le hero', () => {
    const mosaic = component.mosaicTrophies();
    expect(mosaic.length).toBe(1);
    expect(mosaic[0].id).toBe(TROPHY_FEATURED_2024.id);
  });
});

// =============================================================================
// Suite : fallback sans featured
// =============================================================================

describe('PalmaresComponent — fallback sans featured', () => {
  let fixture: ComponentFixture<PalmaresComponent>;
  let component: PalmaresComponent;
  let trophiesService: jasmine.SpyObj<TrophiesService>;
  let gamesService: jasmine.SpyObj<GamesService>;

  const noFeat1: Trophy = { ...TROPHY_NON_FEATURED, id: 10, placement: 3, date: '2023-01-01T00:00:00.000Z' };
  const noFeat2: Trophy = { ...TROPHY_NON_FEATURED, id: 11, placement: 1, date: '2022-06-01T00:00:00.000Z' };

  beforeEach(async () => {
    trophiesService = buildTrophiesSpy([noFeat1, noFeat2]);
    gamesService = buildGamesSpy();

    await TestBed.configureTestingModule({
      imports: [PalmaresComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TrophiesService, useValue: trophiesService },
        { provide: GamesService, useValue: gamesService },
        { provide: SeoService, useValue: buildSeoSpy() },
      ],
    }).compileComponents();

    trophiesService = TestBed.inject(TrophiesService) as jasmine.SpyObj<TrophiesService>;
    gamesService = TestBed.inject(GamesService) as jasmine.SpyObj<GamesService>;
    trophiesService.loadTrophies.and.returnValue(NEVER);
    gamesService.loadActiveGames.and.returnValue(NEVER);

    fixture = TestBed.createComponent(PalmaresComponent);
    component = fixture.componentInstance;
  });

  it('heroTrophy = trophée au meilleur placement (placement 1) parmi les non-featured', () => {
    expect(component.heroTrophy()?.placement).toBe(1);
    expect(component.heroTrophy()?.id).toBe(11);
  });
});

// =============================================================================
// Suite : liste vide
// =============================================================================

describe('PalmaresComponent — liste vide', () => {
  let fixture: ComponentFixture<PalmaresComponent>;
  let component: PalmaresComponent;
  let trophiesService: jasmine.SpyObj<TrophiesService>;
  let gamesService: jasmine.SpyObj<GamesService>;

  beforeEach(async () => {
    trophiesService = buildTrophiesSpy([]);
    gamesService = buildGamesSpy();

    await TestBed.configureTestingModule({
      imports: [PalmaresComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TrophiesService, useValue: trophiesService },
        { provide: GamesService, useValue: gamesService },
        { provide: SeoService, useValue: buildSeoSpy() },
      ],
    }).compileComponents();

    trophiesService = TestBed.inject(TrophiesService) as jasmine.SpyObj<TrophiesService>;
    gamesService = TestBed.inject(GamesService) as jasmine.SpyObj<GamesService>;
    trophiesService.loadTrophies.and.returnValue(of([]));
    gamesService.loadActiveGames.and.returnValue(of(MOCK_GAMES));

    fixture = TestBed.createComponent(PalmaresComponent);
    component = fixture.componentInstance;
  });

  it('heroTrophy est null si aucun trophée disponible', () => {
    expect(component.heroTrophy()).toBeNull();
  });

  it('état vide : .empty-state visible et .hero-monument absent', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.empty-state')).toBeTruthy();
    expect(el.querySelector('.hero-monument')).toBeNull();
  });
});

// =============================================================================
// Suite : échec de chargement (distinct de « aucune donnée »)
// =============================================================================

describe('PalmaresComponent — échec de chargement', () => {
  let fixture: ComponentFixture<PalmaresComponent>;
  let component: PalmaresComponent;
  let trophiesService: jasmine.SpyObj<TrophiesService>;
  let gamesService: jasmine.SpyObj<GamesService>;

  beforeEach(async () => {
    trophiesService = buildTrophiesSpy([]);
    gamesService = buildGamesSpy();

    await TestBed.configureTestingModule({
      imports: [PalmaresComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TrophiesService, useValue: trophiesService },
        { provide: GamesService, useValue: gamesService },
        { provide: SeoService, useValue: buildSeoSpy() },
      ],
    }).compileComponents();

    trophiesService = TestBed.inject(TrophiesService) as jasmine.SpyObj<TrophiesService>;
    gamesService = TestBed.inject(GamesService) as jasmine.SpyObj<GamesService>;

    // Le chargement des trophées (donnée essentielle) échoue réellement.
    trophiesService.loadTrophies.and.returnValue(throwError(() => new Error('boom')));
    gamesService.loadActiveGames.and.returnValue(of(MOCK_GAMES));

    fixture = TestBed.createComponent(PalmaresComponent);
    component = fixture.componentInstance;
  });

  it('affiche .error-state en cas d\'échec réel du chargement', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(component.error()).toBe('Erreur lors du chargement du palmarès');
    expect(component.loading()).toBeFalse();

    const errorState = el.querySelector('.error-state');
    expect(errorState).toBeTruthy();
    expect(errorState!.getAttribute('role')).toBe('alert');

    // On ne doit PAS retomber sur l'état vide en cas d'échec
    expect(el.querySelector('.empty-state')).toBeNull();
  });

  it('un échec du chargement des jeux (auxiliaire) ne bloque pas l\'affichage', () => {
    // Trophées OK, jeux KO → pas d'erreur, palmarès affiché
    trophiesService.loadTrophies.and.returnValue(of([]));
    gamesService.loadActiveGames.and.returnValue(throwError(() => new Error('games down')));

    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    expect(component.error()).toBeUndefined();
    expect(el.querySelector('.error-state')).toBeNull();
    // Aucune donnée trophée → état vide (et non erreur)
    expect(el.querySelector('.empty-state')).toBeTruthy();
  });
});
