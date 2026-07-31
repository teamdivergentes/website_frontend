import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { DashboardTodoComponent } from './dashboard-todo.component';
import {
  AdminDashboardService,
  DashboardTodo,
} from '../../../../shared/services/admin-dashboard.service';

describe('DashboardTodoComponent', () => {
  let fixture: ComponentFixture<DashboardTodoComponent>;

  async function mount(todo: Observable<DashboardTodo>): Promise<void> {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [DashboardTodoComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AdminDashboardService, useValue: { getTodo: () => todo } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardTodoComponent);
    fixture.detectChanges();
  }

  function labels(): string[] {
    const nodes: HTMLElement[] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.entry-label')
    );
    return nodes.map((node) => node.textContent?.trim() ?? '');
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  it('affiche une ligne par alerte, dans l’ordre d’urgence', async () => {
    await mount(
      of({
        matchesWithoutScore: 3,
        articlesWithoutImage: 2,
        matchesWithoutStream: 1,
        dormantDrafts: 4,
      })
    );

    expect(labels()).toEqual([
      '3 matchs passés sans score',
      '2 articles publiés sans image',
      '1 match à venir sans lien de stream',
      '4 brouillons dormants',
    ]);
  });

  it('accorde le libellé au singulier', async () => {
    await mount(of({ matchesWithoutScore: 1, dormantDrafts: 1 }));

    expect(labels()).toEqual(['1 match passé sans score', '1 brouillon dormant']);
  });

  it('lie chaque alerte à sa page', async () => {
    await mount(of({ matchesWithoutScore: 3, articlesWithoutImage: 2 }));

    const matches = fixture.nativeElement.querySelector(
      '[data-testid="dashboard-todo-matchesWithoutScore"]'
    );
    const articles = fixture.nativeElement.querySelector(
      '[data-testid="dashboard-todo-articlesWithoutImage"]'
    );
    expect(matches.getAttribute('href')).toBe('/admin/matches');
    expect(articles.getAttribute('href')).toBe('/admin/articles');
  });

  // ─── Compteur nul et permission manquante ─────────────────────────────────

  it('masque une ligne dont le compteur est à zéro', async () => {
    await mount(of({ matchesWithoutScore: 0, dormantDrafts: 2 }));

    expect(labels()).toEqual(['2 brouillons dormants']);
  });

  it('rend un compteur omis exactement comme un compteur à zéro', async () => {
    // Permission manquante cote backend : le champ est absent. L'utilisateur ne
    // doit voir ni la ligne, ni un message d'acces refuse.
    await mount(of({ dormantDrafts: 2 }));
    const omitted = labels();

    await mount(of({ matchesWithoutScore: 0, articlesWithoutImage: 0, dormantDrafts: 2 }));
    expect(labels()).toEqual(omitted);
  });

  it('n’affiche jamais de message d’accès refusé', async () => {
    await mount(of({}));
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('refus');
  });

  // ─── Etats ────────────────────────────────────────────────────────────────

  it('affiche un skeleton pendant le chargement', async () => {
    await mount(new Subject<DashboardTodo>().asObservable());

    expect(fixture.nativeElement.querySelector('.block-skeleton')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.block-list')).toBeNull();
  });

  it('efface le bloc entier quand les quatre compteurs sont à zéro', async () => {
    await mount(
      of({
        matchesWithoutScore: 0,
        articlesWithoutImage: 0,
        matchesWithoutStream: 0,
        dormantDrafts: 0,
      })
    );

    expect(fixture.nativeElement.querySelector('.dashboard-block')).toBeNull();
  });

  it('efface le bloc en cas de panne, sans barrer le dashboard', async () => {
    await mount(throwError(() => new Error('API HS')));

    expect(fixture.nativeElement.querySelector('.dashboard-block')).toBeNull();
  });
});
