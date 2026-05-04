import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal, computed } from '@angular/core';
import { provideRouter, Route } from '@angular/router';
import { TwitchComponent } from './twitch.component';
import { SeoService } from '../../shared/services/seo.service';
import { routes } from '../../app.routes';
import { LiveStatusService } from '../../../shared/services/live-status.service';

/** Fabrique un mock minimal de LiveStatusService */
function makeLiveStatusMock(isLive = false, liveCount = 0) {
  const channelsSignal = signal<{ id: number; username: string; displayName: string; active: boolean; isLive: boolean }[]>([]);
  return {
    channels: channelsSignal.asReadonly(),
    isLive: computed(() => isLive),
    liveCount: computed(() => liveCount),
    liveChannels: computed(() => channelsSignal().filter(c => c.isLive)),
    offlineChannels: computed(() => channelsSignal().filter(c => !c.isLive)),
    loading: signal(false).asReadonly(),
    hasError: signal(false).asReadonly(),
  };
}

describe('TwitchComponent', () => {
  let component: TwitchComponent;
  let fixture: ComponentFixture<TwitchComponent>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;
  let liveStatusMock: ReturnType<typeof makeLiveStatusMock>;

  beforeEach(async () => {
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);
    liveStatusMock = makeLiveStatusMock();

    await TestBed.configureTestingModule({
      imports: [TwitchComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: seoServiceSpy },
        { provide: LiveStatusService, useValue: liveStatusMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TwitchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Création
  // ─────────────────────────────────────────────────────────────────────────────

  it('devrait se créer', () => {
    expect(component).toBeTruthy();
  });

  it('devrait appeler updateMetaTags avec le titre "En live" au init', () => {
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'En live' })
    );
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Route /twitch
  // ─────────────────────────────────────────────────────────────────────────────

  it('la route /twitch ne doit pas avoir de guard canActivate', () => {
    const mainLayoutRoute = routes.find(r => r.path === '');
    expect(mainLayoutRoute).toBeDefined();

    const twitchRoute = (mainLayoutRoute!.children ?? []).find(
      (r: Route) => r.path === 'twitch'
    );
    expect(twitchRoute).toBeDefined('La route /twitch doit exister dans app.routes.ts');
    expect(twitchRoute!.canActivate).toBeUndefined(
      'La route /twitch ne doit pas avoir de guard canActivate (accessible sans authentification)'
    );
  });

  it('la route /twitch doit avoir le bon titre', () => {
    const mainLayoutRoute = routes.find(r => r.path === '');
    const twitchRoute = (mainLayoutRoute!.children ?? []).find(
      (r: Route) => r.path === 'twitch'
    );
    expect(twitchRoute!.title).toBe('En live · Team Divergentes');
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────────

  describe('getTwitchEmbedUrl()', () => {
    it('doit générer une URL avec le bon format player.twitch.tv', () => {
      const url = component.getTwitchEmbedUrl('teamdvg');
      expect(url).toContain('https://player.twitch.tv/');
      expect(url).toContain('channel=teamdvg');
      expect(url).toContain('parent=');
    });
  });

  describe('getTwitchChannelUrl()', () => {
    it('doit générer un lien direct twitch.tv', () => {
      expect(component.getTwitchChannelUrl('teamdvg')).toBe('https://www.twitch.tv/teamdvg');
    });
  });

  describe('formatViewers()', () => {
    it('doit afficher "0" pour undefined', () => {
      expect(component.formatViewers(undefined)).toBe('0');
    });

    it('doit afficher la valeur brute si < 1000', () => {
      expect(component.formatViewers(450)).toBe('450');
    });

    it('doit afficher en "k" si >= 1000', () => {
      expect(component.formatViewers(1200)).toBe('1.2k');
    });

    it('doit afficher exactement "1.0k" pour 1000', () => {
      expect(component.formatViewers(1000)).toBe('1.0k');
    });
  });

  describe('getThumbnailUrl()', () => {
    it('doit retourner une chaîne vide si pas de thumbnailUrl', () => {
      expect(component.getThumbnailUrl(undefined)).toBe('');
    });

    it('doit remplacer {width} et {height} dans l\'URL', () => {
      const url = component.getThumbnailUrl('https://thumb.tv/{width}x{height}.jpg', 320, 180);
      expect(url).toBe('https://thumb.tv/320x180.jpg');
    });

    it('doit utiliser les dimensions par défaut (440x248)', () => {
      const url = component.getThumbnailUrl('https://thumb.tv/{width}x{height}.jpg');
      expect(url).toBe('https://thumb.tv/440x248.jpg');
    });
  });

  describe('trackByChannelId()', () => {
    it('doit retourner l\'id du channel', () => {
      expect(component.trackByChannelId(0, { id: 42 })).toBe(42);
    });
  });
});
