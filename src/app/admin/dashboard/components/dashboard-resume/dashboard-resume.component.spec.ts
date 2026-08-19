import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { DashboardResumeComponent, relativeAge } from './dashboard-resume.component';
import {
  AdminDashboardService,
  DashboardDraft,
} from '../../../../shared/services/admin-dashboard.service';

const DRAFTS: DashboardDraft[] = [
  { id: 1, title: 'DVG vs KC', slug: 'dvg-vs-kc', updatedAt: iso(2), isMine: true },
  { id: 2, title: 'Roster 2026', slug: 'roster-2026', updatedAt: iso(5), isMine: false },
];

/** Date ISO decalee de `days` jours dans le passe. */
function iso(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

describe('DashboardResumeComponent', () => {
  let fixture: ComponentFixture<DashboardResumeComponent>;

  async function mount(resume: Observable<{ drafts: DashboardDraft[] }>): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [DashboardResumeComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AdminDashboardService, useValue: { getResume: () => resume } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardResumeComponent);
    fixture.detectChanges();
  }

  function labels(): string[] {
    const nodes: HTMLElement[] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.entry-label')
    );
    return nodes.map((node) => node.textContent?.trim() ?? '');
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  it('liste les brouillons', async () => {
    await mount(of({ drafts: DRAFTS }));
    expect(labels()).toEqual(['DVG vs KC', 'Roster 2026']);
  });

  it('lie chaque brouillon à son éditeur', async () => {
    await mount(of({ drafts: DRAFTS }));

    const link = fixture.nativeElement.querySelector('[data-testid="dashboard-draft-1"]');
    expect(link.getAttribute('href')).toBe('/admin/articles/edit/1');
  });

  it('affiche l’ancienneté de chaque brouillon', async () => {
    await mount(of({ drafts: DRAFTS }));

    const ages: HTMLElement[] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.entry-age')
    );
    expect(ages.map((n) => n.textContent?.trim())).toEqual(['2 j', '5 j']);
  });

  it('signale les brouillons d’un autre auteur', async () => {
    await mount(of({ drafts: DRAFTS }));

    const tags = fixture.nativeElement.querySelectorAll('.entry-tag');
    expect(tags).toHaveSize(1);
  });

  // ─── Etats ────────────────────────────────────────────────────────────────

  it('affiche un skeleton pendant le chargement', async () => {
    await mount(new Subject<{ drafts: DashboardDraft[] }>().asObservable());

    expect(fixture.nativeElement.querySelector('.block-skeleton')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.block-list')).toBeNull();
  });

  it('efface le bloc entier plutôt que d’afficher un vide', async () => {
    await mount(of({ drafts: [] }));

    expect(fixture.nativeElement.querySelector('.dashboard-block')).toBeNull();
  });

  it('efface le bloc en cas de panne, sans barrer le dashboard', async () => {
    // Le dashboard n'est pas une page de travail : un bandeau d'erreur y serait
    // plus genant que l'absence du bloc.
    await mount(throwError(() => new Error('API HS')));

    expect(fixture.nativeElement.querySelector('.dashboard-block')).toBeNull();
  });
});

describe('relativeAge', () => {
  const NOW = new Date('2026-07-31T12:00:00.000Z');

  /** Date ISO decalee de `days` jours avant `NOW`. */
  function before(days: number): string {
    return new Date(NOW.getTime() - days * 86_400_000).toISOString();
  }

  it('nomme le jour même', () => {
    expect(relativeAge(before(0), NOW)).toBe("aujourd'hui");
  });

  it('nomme la veille', () => {
    expect(relativeAge(before(1), NOW)).toBe('hier');
  });

  it('compte en jours sous une semaine', () => {
    expect(relativeAge(before(3), NOW)).toBe('3 j');
    expect(relativeAge(before(6), NOW)).toBe('6 j');
  });

  it('bascule en semaines à partir de sept jours', () => {
    expect(relativeAge(before(7), NOW)).toBe('1 sem');
    expect(relativeAge(before(20), NOW)).toBe('2 sem');
  });

  it('traite une date future comme le jour même', () => {
    // Un `updatedAt` legerement en avance sur l'horloge du poste ne doit pas
    // produire "-1 j".
    expect(relativeAge(before(-1), NOW)).toBe("aujourd'hui");
  });
});
