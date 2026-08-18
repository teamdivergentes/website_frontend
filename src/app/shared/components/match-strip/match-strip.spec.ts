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

  // Date future calculée dynamiquement (et non figée en dur) : le test ne doit
  // pas retomber, une fois la date dépassée, sur la branche « moins d'une
  // heure » de formatRelativeSchedule sans que personne ne s'en aperçoive.
  const dansDeuxJours = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

  const upcomingMatch: Match = {
    id: 1,
    teamId: 1,
    opponentName: 'Team Rivale',
    opponentLogo: 'https://example.com/logo.png',
    scheduledAt: dansDeuxJours,
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

  it('affiche le bouton stream quand streamUrl est présent', async () => {
    fixture.componentRef.setInput('upcoming', upcomingMatch);
    fixture.detectChanges();
    await fixture.whenStable();

    const btn = fixture.nativeElement.querySelector('.match-strip__cta');
    expect(btn).not.toBeNull();
    expect(btn.getAttribute('href')).toBe('https://twitch.tv/dvg');
  });

  it("n'affiche pas le bouton stream quand streamUrl est absent", async () => {
    const noStream: Match = { ...upcomingMatch, streamUrl: null };
    fixture.componentRef.setInput('upcoming', noStream);
    fixture.detectChanges();
    await fixture.whenStable();

    const btn = fixture.nativeElement.querySelector('.match-strip__cta');
    expect(btn).toBeNull();
  });

  it('affiche les pastilles de forme V/D/N avec les bonnes classes CSS', async () => {
    // Les pastilles de forme ne s'affichent que dans l'état nominal (mode « upcoming »).
    fixture.componentRef.setInput('upcoming', upcomingMatch);
    fixture.componentRef.setInput('results', [resultWin, resultLoss, resultDraw]);
    fixture.detectChanges();
    await fixture.whenStable();

    // formResults() renvoie les 3 derniers résultats du plus ancien au plus récent :
    // l'ordre d'entrée [win, loss, draw] est donc inversé -> [draw, loss, win].
    const pills = fixture.nativeElement.querySelectorAll('.match-strip__form-pill');
    expect(pills).toHaveSize(3);

    expect(pills[0].classList).toContain('draw');
    expect(pills[0].textContent).toContain('N');

    expect(pills[1].classList).toContain('loss');
    expect(pills[1].textContent).toContain('D');

    expect(pills[2].classList).toContain('win');
    expect(pills[2].textContent).toContain('V');
  });

  it("n'affiche pas de score quand les scores sont manquants", async () => {
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

    // Aucun score affiché : évite le rendu brut « null-null »
    const score = fixture.nativeElement.querySelector('.match-strip__score');
    expect(score).toBeNull();

    const matchup = fixture.nativeElement.querySelector('.match-strip__matchup');
    expect(matchup).not.toBeNull();
    expect(matchup.textContent).not.toContain('null');

    // Le texte accessible complet est porté par un élément visuellement masqué
    // (aria-label est interdit sur un <span> de rôle generic — cf. match-strip.html).
    const texteAccessible = matchup.querySelector('.visually-hidden');
    expect(texteAccessible).not.toBeNull();
    expect(texteAccessible.textContent).toContain('Team Delta');
  });

  it("n'affiche pas de score quand un seul score est présent", async () => {
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

    const score = fixture.nativeElement.querySelector('.match-strip__score');
    expect(score).toBeNull();
    const matchup = fixture.nativeElement.querySelector('.match-strip__matchup');
    expect(matchup.textContent).not.toContain('null');
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

  it('un texte accessible est présent sur la ligne de résultat', async () => {
    // Le repli sur dernier résultat n'affiche que le résultat le plus récent.
    // aria-label est interdit sur le <span> (rôle generic) de la ligne : le
    // texte accessible complet est donc porté par un span .visually-hidden
    // dédié (cf. match-strip.html).
    fixture.componentRef.setInput('results', [resultWin, resultLoss]);
    fixture.detectChanges();
    await fixture.whenStable();

    const matchup = fixture.nativeElement.querySelector('.match-strip__matchup');
    expect(matchup).not.toBeNull();
    const texteAccessible = matchup.querySelector('.visually-hidden');
    expect(texteAccessible).not.toBeNull();
    expect(texteAccessible.textContent.length).toBeGreaterThan(0);
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

  describe('rendu de l’état nominal', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('upcoming', upcomingMatch);
      fixture.componentRef.setInput('results', [resultWin, resultLoss, resultDraw]);
      fixture.detectChanges();
    });

    it('affiche l’affiche du prochain match', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.match-strip__next')).not.toBeNull();
      expect(el.textContent).toContain('Team Rivale');
    });

    it('affiche le côté DVG et l’adversaire dans l’affiche', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.match-strip__crest--dvg')?.textContent?.trim()).toBe('DVG');
      expect(el.querySelector('.match-strip__matchup')?.textContent).toContain('Team Rivale');
    });

    it('affiche l’échéance relative et non la date brute', () => {
      const el = fixture.nativeElement as HTMLElement;
      const echeance = el.querySelector('.match-strip__schedule')?.textContent ?? '';
      expect(echeance.length).toBeGreaterThan(0);
      expect(echeance).toMatch(/AUJOURD'HUI|DEMAIN|DANS /);
    });

    it('affiche le format complet « JOU. D MOIS, HH:MM » pour une échéance à 7 jours ou plus', () => {
      // Branche « date lointaine » de formatRelativeSchedule, jamais exercée
      // par upcomingMatch (à 2 jours) : sans ce cas, une régression sur cette
      // branche (ex. retour à une date brute ISO) passerait inaperçue.
      const dansDixJours = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
      fixture.componentRef.setInput('upcoming', { ...upcomingMatch, scheduledAt: dansDixJours });
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const echeance = el.querySelector('.match-strip__schedule')?.textContent ?? '';
      expect(echeance).toMatch(/^[A-Z]{3}\.\s\d{1,2}\s[\p{Lu}]+,\s\d{2}:\d{2}$/u);
      expect(echeance).not.toMatch(/AUJOURD'HUI|DEMAIN|DANS |MOINS D'UNE HEURE/);
    });

    it('affiche trois pastilles de forme, chacune avec l’adversaire et une année en infobulle', () => {
      const pastilles = fixture.nativeElement.querySelectorAll('.match-strip__form-pill');
      expect(pastilles).toHaveSize(3);
      const adversaires = [
        resultWin.opponentName,
        resultLoss.opponentName,
        resultDraw.opponentName,
      ];
      pastilles.forEach((p: HTMLElement) => {
        const titre = p.getAttribute('title') ?? '';
        expect(adversaires.some((nom) => titre.includes(nom))).toBe(true);
        expect(titre).toMatch(/\d{4}/);
      });
    });

    it('utilise le logo adversaire quand il existe', () => {
      const img = fixture.nativeElement.querySelector('.match-strip__crest img');
      expect(img).not.toBeNull();
      expect(img.getAttribute('alt')).toBe('Team Rivale');
    });

    it('retombe sur les initiales quand le logo est absent', () => {
      fixture.componentRef.setInput('upcoming', { ...upcomingMatch, opponentLogo: null });
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.match-strip__crest img')).toBeNull();
      expect(el.querySelector('.match-strip__crest--opponent')?.textContent?.trim()).toBe('TR');
    });
  });

  describe('rendu du repli sur dernier résultat', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('upcoming', null);
      fixture.componentRef.setInput('results', [resultWin, resultLoss]);
      fixture.detectChanges();
    });

    it('affiche le bloc de repli et pas l’affiche du prochain match', () => {
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.match-strip__last')).not.toBeNull();
      expect(el.querySelector('.match-strip__next')).toBeNull();
    });

    it('affiche la date du dernier résultat en clair', () => {
      const label =
        fixture.nativeElement.querySelector('.match-strip__last-label')?.textContent ?? '';
      expect(label).toContain('2025');
    });

    it('affiche les deux scores dans leurs éléments dédiés', () => {
      const el = fixture.nativeElement as HTMLElement;
      // Cibler les éléments précis : une assertion sur textContent entier
      // passerait grâce à l'année affichée dans le label (« 2025 »).
      expect(el.querySelector('.match-strip__score')?.textContent?.trim()).toBe('2');
      expect(el.querySelector('.match-strip__score-opponent')?.textContent?.trim()).toBe('1');
      expect(el.querySelector('.match-strip__matchup')?.textContent).toContain('Team Alpha');
    });

    it('teinte le score DVG selon l’issue du match', () => {
      const score = fixture.nativeElement.querySelector('.match-strip__score') as HTMLElement;
      expect(score.classList).toContain('win');
      expect(score.classList).not.toContain('loss');
    });

    it('affiche le lien vers le résumé quand articleSlug existe', () => {
      const lien = fixture.nativeElement.querySelector('.match-strip__recap');
      expect(lien).not.toBeNull();
      expect(lien.getAttribute('href')).toContain('victoire-finale');
    });

    it('masque le lien vers le résumé sans articleSlug', () => {
      fixture.componentRef.setInput('results', [resultLoss]);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.match-strip__recap')).toBeNull();
    });

    it('mentionne que le calendrier n’est pas communiqué', () => {
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('calendrier');
    });
  });
});
