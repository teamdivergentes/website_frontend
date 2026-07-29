import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { AdminShortcutsService } from '../../../shared/services/admin-shortcuts.service';
import { AdminShortcut } from '../../../shared/config/admin-shortcuts';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Crée un mock AdminShortcutsService exposant les raccourcis fournis. */
function makeShortcutsMock(shortcuts: AdminShortcut[]) {
  return { availableShortcuts: signal(shortcuts) };
}

/** Monte la sidebar avec les raccourcis fournis. */
async function mount(shortcuts: AdminShortcut[]): Promise<ComponentFixture<AdminSidebarComponent>> {
  await TestBed.configureTestingModule({
    imports: [AdminSidebarComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
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
