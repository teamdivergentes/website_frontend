import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { CommandPaletteComponent } from './command-palette.component';
import { AdminShortcutsService } from '../../../shared/services/admin-shortcuts.service';
import { AdminShortcut } from '../../../shared/config/admin-shortcuts';
import { AdminAction } from '../../../shared/config/admin-actions';

const DESTINATIONS: AdminShortcut[] = [
  {
    key: 'articles',
    label: 'Articles',
    icon: 'article',
    route: '/admin/articles',
    requiredPermissions: ['articles:read'],
    section: 'contenu',
  },
  {
    key: 'teams',
    label: 'Équipes',
    icon: 'groups',
    route: '/admin/teams',
    requiredPermissions: ['teams:read'],
    section: 'esport',
  },
];

const ACTIONS: AdminAction[] = [
  {
    key: 'article-new',
    label: 'Nouvel article',
    icon: 'post_add',
    route: '/admin/articles/new',
    requiredPermissions: ['articles:write'],
  },
  {
    key: 'match-new',
    label: 'Nouveau match',
    icon: 'add_circle',
    route: '/admin/matches',
    queryParams: { nouveau: '1' },
    requiredPermissions: ['matches:write'],
  },
];

describe('CommandPaletteComponent', () => {
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let component: CommandPaletteComponent;
  let dialogRef: jasmine.SpyObj<MatDialogRef<CommandPaletteComponent>>;
  let router: Router;

  async function mount(
    destinations: AdminShortcut[] = DESTINATIONS,
    actions: AdminAction[] = ACTIONS
  ): Promise<void> {
    // Un test peut remonter la palette avec un autre jeu de permissions ; le
    // module de test doit repartir de zero pour accepter une reconfiguration.
    TestBed.resetTestingModule();

    dialogRef = jasmine.createSpyObj<MatDialogRef<CommandPaletteComponent>>('MatDialogRef', [
      'close',
    ]);

    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: AdminShortcutsService,
          useValue: {
            availableShortcuts: signal(destinations),
            availableActions: signal(actions),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  /** Simule une frappe dans le champ de recherche. */
  function type(value: string): void {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('.palette-input');
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  /** Envoie une touche sur la racine de la palette. */
  function press(key: string): void {
    fixture.nativeElement
      .querySelector('.palette')
      .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    fixture.detectChanges();
  }

  function labels(): string[] {
    const nodes: HTMLElement[] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.palette-label')
    );
    return nodes.map((node) => node.textContent?.trim() ?? '');
  }

  beforeEach(async () => {
    await mount();
  });

  // ─── Index et permissions ─────────────────────────────────────────────────

  it('liste les destinations puis les actions', () => {
    expect(labels()).toEqual(['Articles', 'Équipes', 'Nouvel article', 'Nouveau match']);
  });

  it('n’expose que ce que le service laisse passer', async () => {
    // Immunite par construction : l'index EST `availableShortcuts()` /
    // `availableActions()`, il n'y a pas de second filtrage a contourner.
    await mount([DESTINATIONS[0]], []);
    expect(labels()).toEqual(['Articles']);
  });

  it('n’affiche aucune catégorie vide', async () => {
    await mount(DESTINATIONS, []);
    const groups: HTMLElement[] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.palette-group')
    );
    expect(groups.map((g) => g.textContent?.trim())).toEqual(['Aller à']);
  });

  // ─── Filtrage ─────────────────────────────────────────────────────────────

  it('filtre sur la saisie', () => {
    type('art');
    expect(labels()).toEqual(['Articles', 'Nouvel article']);
  });

  it('ignore les accents', () => {
    // Sans repli d'accents, "equipes" ne trouverait jamais "Équipes".
    type('equipes');
    expect(labels()).toEqual(['Équipes']);
  });

  it('ignore la casse', () => {
    type('ARTICLES');
    expect(labels()).toEqual(['Articles']);
  });

  it('affiche un message explicite plutôt qu’une liste vide', () => {
    type('zzz');
    const empty = fixture.nativeElement.querySelector('.palette-empty');
    expect(empty).not.toBeNull();
    expect(empty.textContent).toContain('zzz');
  });

  // ─── Navigation au clavier ────────────────────────────────────────────────

  it('sélectionne la première entrée par défaut', () => {
    expect(component.active().key).toBe('articles');
  });

  it('descend et remonte dans la liste', () => {
    press('ArrowDown');
    expect(component.active().key).toBe('teams');

    press('ArrowUp');
    expect(component.active().key).toBe('articles');
  });

  it('traverse la frontière entre destinations et actions', () => {
    press('ArrowDown');
    press('ArrowDown');
    expect(component.active().key).toBe('article-new');
  });

  it('boucle aux extrémités', () => {
    press('ArrowUp');
    expect(component.active().key).toBe('match-new');

    press('ArrowDown');
    expect(component.active().key).toBe('articles');
  });

  it('replace la sélection en tête après un filtrage', () => {
    // Sans ce repli, la selection restait sur une entree disparue du filtre
    // et Entree n'ouvrait rien.
    press('ArrowDown');
    expect(component.active().key).toBe('teams');

    type('art');
    expect(component.active().key).toBe('articles');
  });

  it('neutralise le défilement natif des flèches', () => {
    const event = new KeyboardEvent('keydown', {
      key: 'ArrowDown',
      bubbles: true,
      cancelable: true,
    });
    fixture.nativeElement.querySelector('.palette').dispatchEvent(event);
    expect(event.defaultPrevented).toBeTrue();
  });

  // ─── Ouverture ────────────────────────────────────────────────────────────

  it('navigue vers l’entrée active sur Entrée', () => {
    press('ArrowDown');
    press('Enter');

    expect(router.navigate).toHaveBeenCalledWith(['/admin/teams'], { queryParams: undefined });
  });

  it('joint les paramètres d’URL d’une action de création', () => {
    type('match');
    press('Enter');

    expect(router.navigate).toHaveBeenCalledWith(['/admin/matches'], {
      queryParams: { nouveau: '1' },
    });
  });

  it('ferme la palette avant de naviguer', () => {
    press('Enter');
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('navigue aussi au clic', () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('.palette-entry');
    button.click();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/articles'], { queryParams: undefined });
  });

  it('n’ouvre rien quand la recherche ne retourne aucun résultat', () => {
    type('zzz');
    press('Enter');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  // ─── Accessibilité ────────────────────────────────────────────────────────

  it('place le focus dans le champ de recherche à l’ouverture', () => {
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.palette-input'));
  });

  it('désigne l’entrée active pour les lecteurs d’écran', () => {
    const input = fixture.nativeElement.querySelector('.palette-input');
    expect(input.getAttribute('aria-activedescendant')).toBe('palette-articles');

    press('ArrowDown');
    expect(input.getAttribute('aria-activedescendant')).toBe('palette-teams');
  });

  it('expose la liste en listbox et ses entrées en options', () => {
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).not.toBeNull();

    const selected = fixture.nativeElement.querySelectorAll('[role="option"][aria-selected="true"]');
    expect(selected).toHaveSize(1);
  });
});
