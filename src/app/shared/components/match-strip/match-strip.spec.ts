import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { MatchStripComponent } from './match-strip';
import { Match } from '../../models/match.model';

// La carte « prochain match » utilise le DatePipe avec le locale 'fr'.
// Il doit être enregistré pour le contexte de test (comme dans app.config.ts).
registerLocaleData(localeFr);

describe('MatchStripComponent', () => {
  let fixture: ComponentFixture<MatchStripComponent>;

  const upcomingMatch: Match = {
    id: 1,
    teamId: 1,
    opponentName: 'Team Rivale',
    opponentLogo: 'https://example.com/logo.png',
    scheduledAt: '2025-09-15T18:00:00.000Z',
    competition: 'Coupe de France',
    streamUrl: 'https://twitch.tv/dvg',
    scoreDvg: null,
    scoreOpponent: null,
    articleSlug: null,
  };

  const resultWin: Match = {
    id: 2,
    teamId: 1,
    opponentName: 'Team Alpha',
    scheduledAt: '2025-06-01T16:00:00.000Z',
    streamUrl: null,
    scoreDvg: 2,
    scoreOpponent: 1,
    articleSlug: 'victoire-finale',
  };

  const resultLoss: Match = {
    id: 3,
    teamId: 1,
    opponentName: 'Team Beta',
    scheduledAt: '2025-05-15T14:00:00.000Z',
    streamUrl: null,
    scoreDvg: 0,
    scoreOpponent: 2,
    articleSlug: null,
  };

  const resultDraw: Match = {
    id: 4,
    teamId: 1,
    opponentName: 'Team Gamma',
    scheduledAt: '2025-04-10T12:00:00.000Z',
    streamUrl: null,
    scoreDvg: 1,
    scoreOpponent: 1,
    articleSlug: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchStripComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(MatchStripComponent);
  });

  afterEach(() => fixture.destroy());

  it('ne rend rien quand upcoming est null et results est vide', async () => {
    fixture.detectChanges();
    await fixture.whenStable();
    const strip = fixture.nativeElement.querySelector('.match-strip');
    expect(strip).toBeNull();
  });

  it('rend la carte prochain match quand upcoming est fourni', async () => {
    fixture.componentRef.setInput('upcoming', upcomingMatch);
    fixture.detectChanges();
    await fixture.whenStable();

    const card = fixture.nativeElement.querySelector('.match-strip__next');
    expect(card).not.toBeNull();
    const matchup = fixture.nativeElement.querySelector('.match-strip__matchup');
    expect(matchup.textContent).toContain('TEAM RIVALE');
    expect(matchup.textContent).toContain('DVG');
  });

  it('affiche le bouton stream quand streamUrl est présent', async () => {
    fixture.componentRef.setInput('upcoming', upcomingMatch);
    fixture.detectChanges();
    await fixture.whenStable();

    const btn = fixture.nativeElement.querySelector('.match-strip__watch-btn');
    expect(btn).not.toBeNull();
    expect(btn.getAttribute('href')).toBe('https://twitch.tv/dvg');
  });

  it("n'affiche pas le bouton stream quand streamUrl est absent", async () => {
    const noStream: Match = { ...upcomingMatch, streamUrl: null };
    fixture.componentRef.setInput('upcoming', noStream);
    fixture.detectChanges();
    await fixture.whenStable();

    const btn = fixture.nativeElement.querySelector('.match-strip__watch-btn');
    expect(btn).toBeNull();
  });

  it('affiche les badges V/D/N avec les bonnes classes CSS', async () => {
    fixture.componentRef.setInput('results', [resultWin, resultLoss, resultDraw]);
    fixture.detectChanges();
    await fixture.whenStable();

    const badges = fixture.nativeElement.querySelectorAll('.match-strip__result-badge');
    expect(badges.length).toBe(3);

    expect(badges[0].classList).toContain('win');
    expect(badges[0].textContent).toContain('V');

    expect(badges[1].classList).toContain('loss');
    expect(badges[1].textContent).toContain('D');

    expect(badges[2].classList).toContain('draw');
    expect(badges[2].textContent).toContain('N');
  });

  it('rend un lien article quand articleSlug est présent', async () => {
    fixture.componentRef.setInput('results', [resultWin]);
    fixture.detectChanges();
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('a.match-strip__result-row--link');
    expect(link).not.toBeNull();
  });

  it('rend une div (pas de lien) quand articleSlug est absent', async () => {
    fixture.componentRef.setInput('results', [resultLoss]);
    fixture.detectChanges();
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('a.match-strip__result-row--link');
    expect(link).toBeNull();

    const div = fixture.nativeElement.querySelector('div.match-strip__result-row');
    expect(div).not.toBeNull();
  });

  it("n'affiche pas de badge de résultat quand les scores sont manquants", async () => {
    const noScore: Match = {
      id: 5,
      teamId: 1,
      opponentName: 'Team Delta',
      scheduledAt: '2025-03-01T10:00:00.000Z',
      streamUrl: null,
      scoreDvg: null,
      scoreOpponent: null,
      articleSlug: null,
    };
    fixture.componentRef.setInput('results', [noScore]);
    fixture.detectChanges();
    await fixture.whenStable();

    // Aucun badge : évite l'affichage brut « null-null »
    const badge = fixture.nativeElement.querySelector('.match-strip__result-badge');
    expect(badge).toBeNull();

    // La ligne reste rendue avec l'adversaire et un aria-label neutre
    const row = fixture.nativeElement.querySelector('.match-strip__result-row');
    expect(row).not.toBeNull();
    expect(row.textContent).not.toContain('null');
    expect(row.getAttribute('aria-label')).toContain('Team Delta');
  });

  it("n'affiche pas de badge quand un seul score est présent", async () => {
    const partial: Match = {
      id: 6,
      teamId: 1,
      opponentName: 'Team Epsilon',
      scheduledAt: '2025-02-01T10:00:00.000Z',
      streamUrl: null,
      scoreDvg: 2,
      scoreOpponent: null,
      articleSlug: null,
    };
    fixture.componentRef.setInput('results', [partial]);
    fixture.detectChanges();
    await fixture.whenStable();

    const badge = fixture.nativeElement.querySelector('.match-strip__result-badge');
    expect(badge).toBeNull();
    const row = fixture.nativeElement.querySelector('.match-strip__result-row');
    expect(row.textContent).not.toContain('null');
  });

  it('AUCUN emoji médaille (🥇🥈🥉🏆) dans le rendu du bandeau', async () => {
    fixture.componentRef.setInput('upcoming', upcomingMatch);
    fixture.componentRef.setInput('results', [resultWin, resultLoss, resultDraw]);
    fixture.detectChanges();
    await fixture.whenStable();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('🥇');
    expect(text).not.toContain('🥈');
    expect(text).not.toContain('🥉');
    expect(text).not.toContain('🏆');
  });

  it('aria-label est présent sur les lignes de résultats', async () => {
    fixture.componentRef.setInput('results', [resultWin, resultLoss]);
    fixture.detectChanges();
    await fixture.whenStable();

    const rows = fixture.nativeElement.querySelectorAll('.match-strip__result-row');
    expect(rows.length).toBe(2);
    rows.forEach((row: HTMLElement) => {
      expect(row.getAttribute('aria-label')).not.toBeNull();
      expect(row.getAttribute('aria-label')!.length).toBeGreaterThan(0);
    });
  });

  describe('mode d’affichage', () => {
    it('est « upcoming » quand un match à venir existe', () => {
      fixture.componentRef.setInput('upcoming', upcomingMatch);
      fixture.componentRef.setInput('results', [resultWin]);
      fixture.detectChanges();
      expect(fixture.componentInstance.mode()).toBe('upcoming');
    });

    it('est « last-result » sans match à venir mais avec des résultats', () => {
      fixture.componentRef.setInput('upcoming', null);
      fixture.componentRef.setInput('results', [resultWin, resultLoss]);
      fixture.detectChanges();
      expect(fixture.componentInstance.mode()).toBe('last-result');
      expect(fixture.componentInstance.lastResult()).toEqual(resultWin);
    });

    it('est « empty » sans match à venir ni résultat', () => {
      fixture.componentRef.setInput('upcoming', null);
      fixture.componentRef.setInput('results', []);
      fixture.detectChanges();
      expect(fixture.componentInstance.mode()).toBe('empty');
      expect(fixture.componentInstance.lastResult()).toBeNull();
    });

    it('ne rend rien en mode « empty » (non-régression)', () => {
      fixture.componentRef.setInput('upcoming', null);
      fixture.componentRef.setInput('results', []);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.match-strip')).toBeNull();
    });
  });
});
