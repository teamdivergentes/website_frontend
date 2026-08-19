import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminShortcutsService } from '../../../shared/services/admin-shortcuts.service';
import { AdminShortcut } from '../../../shared/config/admin-shortcuts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Crée un mock AdminShortcutsService exposant les raccourcis fournis.
 * `shortcutsBySection` reproduit le regroupement réel du service, ordre
 * d'insertion inclus — c'est précisément ce que la sidebar ne doit pas
 * consommer tel quel pour ordonner ses groupes.
 */
function makeShortcutsMock(shortcuts: AdminShortcut[]) {
  const bySection = new Map<AdminShortcut['section'], AdminShortcut[]>();
  for (const s of shortcuts) {
    bySection.set(s.section, [...(bySection.get(s.section) ?? []), s]);
  }
  return {
    availableShortcuts: signal(shortcuts),
    shortcutsBySection: signal(bySection),
  };
}

/** Monte la sidebar avec les raccourcis fournis. */
async function mount(shortcuts: AdminShortcut[]): Promise<ComponentFixture<AdminSidebarComponent>> {
  await TestBed.configureTestingModule({
    imports: [AdminSidebarComponent],
    providers: [
      provideZonelessChangeDetection(),
      // Routes factices : routerLinkActive a besoin de routes resolvables pour marquer l'actif.
      provideRouter([{ path: 'admin/teams', children: [] }, { path: 'admin', children: [] }]),
      { provide: AdminShortcutsService, useValue: makeShortcutsMock(shortcuts) },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(AdminSidebarComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  return fixture;
}

/**
 * Retourne la valeur de `data-icon` de l'icône rendue pour un raccourci.
 * FontAwesome expose le nom kebab-case de l'icône sur le `<svg>` généré.
 */
function renderedIcon(fixture: ComponentFixture<AdminSidebarComponent>, key: string): string | null {
  const link: HTMLElement | null = fixture.nativeElement.querySelector(`[data-testid="admin-nav-${key}"]`);
  return link?.querySelector('svg')?.getAttribute('data-icon') ?? null;
}

/** Construit un raccourci minimal pour les tests. */
function makeShortcut(key: string, section?: AdminShortcut['section']): AdminShortcut {
  return { key, label: key, icon: key, route: `/admin/${key}`, requiredPermissions: [], section };
}

/** Racine DOM typée du composant. */
function root(fixture: ComponentFixture<AdminSidebarComponent>): HTMLElement {
  return fixture.nativeElement as HTMLElement;
}

/** Libellés des en-têtes de groupe effectivement rendus, dans l'ordre du DOM. */
function renderedHeaders(fixture: ComponentFixture<AdminSidebarComponent>): string[] {
  return Array.from(
    root(fixture).querySelectorAll<HTMLElement>('[data-testid="admin-nav-section"]'),
  ).map(el => el.textContent?.trim() ?? '');
}

/** Clés des raccourcis rendus, dans l'ordre du DOM. */
function renderedKeys(fixture: ComponentFixture<AdminSidebarComponent>): string[] {
  return Array.from(root(fixture).querySelectorAll<HTMLElement>('[data-testid^="admin-nav-"]'))
    .map(el => el.getAttribute('data-testid') ?? '')
    .filter(id => id !== 'admin-nav-section' && id !== 'admin-nav-separator')
    .map(id => id.replace('admin-nav-', ''));
}

/** Périmètre `main` complet — ce que voit un Admin (12 entrées). */
const ADMIN_SCOPE: AdminShortcut[] = [
  makeShortcut('dashboard'),
  makeShortcut('analytics'),
  makeShortcut('teams', 'esport'),
  makeShortcut('games', 'esport'),
  makeShortcut('articles', 'contenu'),
  makeShortcut('twitch-channels', 'contenu'),
  makeShortcut('sponsors', 'contenu'),
  makeShortcut('staff', 'structure'),
  makeShortcut('recruitment', 'structure'),
  makeShortcut('users', 'admin'),
  makeShortcut('roles', 'admin'),
  makeShortcut('config', 'admin'),
];

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('AdminSidebarComponent — icônes', () => {
  it('Dashboard utilise une jauge, pas une maison', async () => {
    const fixture = await mount([makeShortcut('dashboard')]);
    expect(renderedIcon(fixture, 'dashboard')).toBe('gauge-high');
  });

  it('Équipes utilise un groupe de personnes, pas une manette', async () => {
    const fixture = await mount([makeShortcut('teams', 'esport')]);
    expect(renderedIcon(fixture, 'teams')).toBe('users');
  });

  it('Jeux utilise une manette, pas un dé de casino', async () => {
    const fixture = await mount([makeShortcut('games', 'esport')]);
    expect(renderedIcon(fixture, 'games')).toBe('gamepad');
  });

  it('Comptes utilise un badge, distinct de l’icône des Équipes', async () => {
    const fixture = await mount([makeShortcut('users', 'admin'), makeShortcut('teams', 'esport')]);
    expect(renderedIcon(fixture, 'users')).toBe('id-badge');
    expect(renderedIcon(fixture, 'users')).not.toBe(renderedIcon(fixture, 'teams'));
  });

  it('Live Twitch utilise une antenne de diffusion, pas un téléviseur', async () => {
    const fixture = await mount([makeShortcut('twitch-channels', 'contenu')]);
    expect(renderedIcon(fixture, 'twitch-channels')).toBe('tower-broadcast');
  });

  it('une clé inconnue retombe sur une icône par défaut sans planter', async () => {
    const fixture = await mount([makeShortcut('cle-inexistante', 'contenu')]);
    expect(renderedIcon(fixture, 'cle-inexistante')).toBeTruthy();
  });
});

describe('AdminSidebarComponent — regroupement en sections', () => {
  // ─── Rendu Admin : le périmètre complet ────────────────────────────────────

  it('rend les 4 groupes non vides dans l’ordre de SECTION_ORDER', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    expect(renderedHeaders(fixture)).toEqual([
      'Compétition',
      'Contenu',
      'Structure',
      'Administration',
    ]);
  });

  it('place la zone épinglée en tête, avant tout en-tête de groupe', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    expect(renderedKeys(fixture).slice(0, 2)).toEqual(['dashboard', 'analytics']);
  });

  it('n’affiche aucun en-tête au-dessus de la zone épinglée', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    const first: Element = fixture.nativeElement.querySelector('.sidebar-nav')!.firstElementChild!;
    expect(first.getAttribute('data-testid')).not.toBe('admin-nav-section');
  });

  it('conserve les 12 entrées du périmètre main', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    expect(renderedKeys(fixture)).toHaveSize(12);
  });

  // ─── Ordre : SECTION_ORDER prime sur l'ordre du registre ───────────────────

  it('suit SECTION_ORDER même quand le registre déclare les groupes dans le désordre', async () => {
    const fixture = await mount([
      makeShortcut('config', 'admin'),
      makeShortcut('roles', 'admin'),
      makeShortcut('staff', 'structure'),
      makeShortcut('recruitment', 'structure'),
      makeShortcut('teams', 'esport'),
      makeShortcut('games', 'esport'),
    ]);
    expect(renderedHeaders(fixture)).toEqual(['Compétition', 'Structure', 'Administration']);
  });

  // ─── Règle de dégradation sous permissions ────────────────────────────────

  it('ne rend rien pour un groupe sans aucun item', async () => {
    const fixture = await mount([makeShortcut('teams', 'esport'), makeShortcut('games', 'esport')]);
    expect(renderedHeaders(fixture)).toEqual(['Compétition']);
  });

  it('masque l’en-tête d’un groupe réduit à un seul item, mais garde l’item', async () => {
    const fixture = await mount([
      makeShortcut('dashboard'),
      makeShortcut('articles', 'contenu'),
      makeShortcut('teams', 'esport'),
      makeShortcut('games', 'esport'),
    ]);
    expect(renderedHeaders(fixture)).toEqual(['Compétition']);
    expect(renderedKeys(fixture)).toContain('articles');
  });

  it('rend le cas dégénéré du CM (2 entrées) sans aucun en-tête', async () => {
    const fixture = await mount([makeShortcut('dashboard'), makeShortcut('articles', 'contenu')]);
    expect(renderedHeaders(fixture)).toEqual([]);
    expect(renderedKeys(fixture)).toEqual(['dashboard', 'articles']);
  });

  it('rend le périmètre Gestionnaire avec 3 groupes et aucun orphelin', async () => {
    const fixture = await mount([
      makeShortcut('dashboard'),
      makeShortcut('teams', 'esport'),
      makeShortcut('games', 'esport'),
      makeShortcut('articles', 'contenu'),
      makeShortcut('twitch-channels', 'contenu'),
      makeShortcut('sponsors', 'contenu'),
      makeShortcut('staff', 'structure'),
      makeShortcut('recruitment', 'structure'),
    ]);
    expect(renderedHeaders(fixture)).toEqual(['Compétition', 'Contenu', 'Structure']);
  });

  it('ne rend rien du tout pour un utilisateur sans aucun raccourci', async () => {
    const fixture = await mount([]);
    expect(renderedHeaders(fixture)).toEqual([]);
    expect(renderedKeys(fixture)).toEqual([]);
  });

  // ─── Mode replié ──────────────────────────────────────────────────────────

  it('remplace les en-têtes par des séparateurs en mode replié', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(renderedHeaders(fixture)).toEqual([]);
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="admin-nav-separator"]').length,
    ).toBe(4);
  });

  it('conserve tous les items en mode replié', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(renderedKeys(fixture)).toHaveSize(12);
  });
});

describe('AdminSidebarComponent — accessibilité', () => {
  it('nomme la région de navigation', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    expect(root(fixture).querySelector('nav')?.getAttribute('aria-label')).toBeTruthy();
  });

  it('marque l’item actif avec aria-current="page"', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    await TestBed.inject(Router).navigateByUrl('/admin/teams');
    fixture.detectChanges();
    await fixture.whenStable();

    const active = root(fixture).querySelector('[data-testid="admin-nav-teams"]');
    expect(active?.getAttribute('aria-current')).toBe('page');
  });

  it('ne marque aucun autre item que l’actif', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    await TestBed.inject(Router).navigateByUrl('/admin/teams');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(root(fixture).querySelectorAll('[aria-current="page"]')).toHaveSize(1);
  });

  it('expose l’état déployé/replié sur le bouton de bascule', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    const btn = root(fixture).querySelector('.collapse-btn');
    expect(btn?.getAttribute('aria-expanded')).toBe('true');

    fixture.componentRef.setInput('collapsed', true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(root(fixture).querySelector('.collapse-btn')?.getAttribute('aria-expanded')).toBe('false');
  });

  it('retire le drawer fermé du parcours de tabulation en mobile', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    fixture.componentRef.setInput('isMobile', true);
    fixture.detectChanges();
    await fixture.whenStable();

    // Hors écran via translateX : sans `inert`, Tab traverse quand même tous les liens.
    expect(root(fixture).querySelector('aside')?.hasAttribute('inert')).toBeTrue();
  });

  it('rend le drawer focusable une fois ouvert en mobile', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    fixture.componentRef.setInput('isMobile', true);
    fixture.componentRef.setInput('mobileOpen', true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(root(fixture).querySelector('aside')?.hasAttribute('inert')).toBeFalse();
  });

  it('laisse la sidebar focusable en desktop, drawer fermé ou non', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    expect(root(fixture).querySelector('aside')?.hasAttribute('inert')).toBeFalse();
  });

  it('demande la fermeture du drawer mobile sur Escape', async () => {
    const fixture = await mount(ADMIN_SCOPE);
    fixture.componentRef.setInput('mobileOpen', true);
    fixture.detectChanges();
    await fixture.whenStable();

    let closed = false;
    fixture.componentInstance.closeMobile.subscribe(() => (closed = true));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(closed).toBeTrue();
  });

  it('ignore Escape quand le drawer mobile est fermé', async () => {
    const fixture = await mount(ADMIN_SCOPE);

    let closed = false;
    fixture.componentInstance.closeMobile.subscribe(() => (closed = true));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await fixture.whenStable();

    expect(closed).toBeFalse();
  });
});
