import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError, NEVER } from 'rxjs';
import { PalmaresComponent } from './palmares';
import { TrophiesService } from '../../../shared/services/trophies.service';
import { SeoService } from '../../../shared/services/seo.service';
import { Trophy } from '../../../shared/models/trophy.model';

describe('PalmaresComponent', () => {
  let fixture: ComponentFixture<PalmaresComponent>;
  let component: PalmaresComponent;
  let trophiesService: jasmine.SpyObj<TrophiesService>;
  let seoService: jasmine.SpyObj<SeoService>;

  const featured: Trophy = {
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
    active: true,
  };

  beforeEach(async () => {
    const trophiesSignal = signal<Trophy[]>([featured]);
    const featuredSignal = signal<Trophy[]>([featured]);
    const byYearSignal = signal([{ year: 2025, trophies: [featured] }]);

    const trophiesSpy = jasmine.createSpyObj(
      'TrophiesService',
      ['loadTrophies'],
      {
        trophies: trophiesSignal.asReadonly(),
        featuredTrophies: featuredSignal.asReadonly(),
        trophiesByYear: byYearSignal.asReadonly(),
      },
    );

    const seoSpy = jasmine.createSpyObj('SeoService', [
      'updateMetaTags',
      'setJsonLd',
      'getBreadcrumbListJsonLd',
    ]);
    seoSpy.getBreadcrumbListJsonLd.and.returnValue({ '@type': 'BreadcrumbList' });

    await TestBed.configureTestingModule({
      imports: [PalmaresComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TrophiesService, useValue: trophiesSpy },
        { provide: SeoService, useValue: seoSpy },
      ],
    }).compileComponents();

    trophiesService = TestBed.inject(TrophiesService) as jasmine.SpyObj<TrophiesService>;
    seoService = TestBed.inject(SeoService) as jasmine.SpyObj<SeoService>;
    trophiesService.loadTrophies.and.returnValue(NEVER);

    fixture = TestBed.createComponent(PalmaresComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('configure le SEO au init', () => {
    fixture.detectChanges();
    expect(seoService.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Palmarès', url: '/structure/palmares' }),
    );
    expect(seoService.setJsonLd).toHaveBeenCalled();
  });

  it('charge les trophées au init', () => {
    trophiesService.loadTrophies.and.returnValue(of([featured]));
    fixture.detectChanges();
    expect(trophiesService.loadTrophies).toHaveBeenCalled();
    expect(component.loading()).toBeFalse();
  });

  it('affiche une erreur si le chargement échoue', () => {
    trophiesService.loadTrophies.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    expect(component.error()).toBe('Erreur lors du chargement du palmarès');
  });

  it('placementLabel retourne médaille pour 1-3 et Top n au-delà', () => {
    expect(component.placementLabel(1)).toBe('🥇');
    expect(component.placementLabel(2)).toBe('🥈');
    expect(component.placementLabel(3)).toBe('🥉');
    expect(component.placementLabel(4)).toBe('Top 4');
  });

  it('le rail featured est rendu avec une carte par trophée à la une', () => {
    trophiesService.loadTrophies.and.returnValue(of([featured]));
    fixture.detectChanges();
    const cards = (fixture.nativeElement as HTMLElement).querySelectorAll('.featured-card');
    expect(cards.length).toBe(1);
  });

  // railScrollable : dans JSDOM scrollWidth === clientWidth (pas de layout réel),
  // donc railScrollable() reste false après rendu. On teste updateRailScrollable()
  // directement en simulant les dimensions du DOM.
  describe('railScrollable', () => {
    it('vaut false par défaut (pas de débordement)', () => {
      expect(component.railScrollable()).toBeFalse();
    });

    it('updateRailScrollable met railScrollable à true si scrollWidth > clientWidth', () => {
      trophiesService.loadTrophies.and.returnValue(of([featured]));
      fixture.detectChanges();

      const rail = (fixture.nativeElement as HTMLElement).querySelector('.featured-rail');
      if (rail) {
        // Simule un débordement en surchargeant les propriétés en lecture seule
        Object.defineProperty(rail, 'scrollWidth', { value: 900, configurable: true });
        Object.defineProperty(rail, 'clientWidth', { value: 400, configurable: true });
      }
      component.updateRailScrollable();
      expect(component.railScrollable()).toBeTrue();
    });

    it('updateRailScrollable met railScrollable à false si scrollWidth <= clientWidth', () => {
      trophiesService.loadTrophies.and.returnValue(of([featured]));
      fixture.detectChanges();

      const rail = (fixture.nativeElement as HTMLElement).querySelector('.featured-rail');
      if (rail) {
        Object.defineProperty(rail, 'scrollWidth', { value: 300, configurable: true });
        Object.defineProperty(rail, 'clientWidth', { value: 400, configurable: true });
      }
      component.updateRailScrollable();
      expect(component.railScrollable()).toBeFalse();
    });
  });
});
