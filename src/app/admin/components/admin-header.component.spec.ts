import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { AdminHeaderComponent } from './admin-header.component';
import { AuthService } from '../../../shared/services/api/auth.service';

/** Routes admin minimales : `routerLink` a besoin de cibles resolvables. */
const ROUTES = [
  { path: 'admin', children: [] },
  { path: 'admin/articles', children: [] },
  { path: 'admin/articles/edit/:id', children: [] },
  { path: 'admin/matches', children: [] },
  { path: 'admin/twitch-channels', children: [] },
  { path: 'admin/trophies', children: [] },
];

describe('AdminHeaderComponent — fil d’Ariane', () => {
  let fixture: ComponentFixture<AdminHeaderComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminHeaderComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter(ROUTES),
        {
          provide: AuthService,
          useValue: {
            user: signal({ email: 'admin@teamdivergentes.fr' }),
            role: signal({ name: 'Admin' }),
            logout: jasmine.createSpy('logout'),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(AdminHeaderComponent);
  });

  /** Navigue puis rend, et retourne les libelles affiches du fil. */
  async function trailAt(url: string): Promise<string[]> {
    await router.navigateByUrl(url);
    fixture.detectChanges();
    await fixture.whenStable();
    const nodes: HTMLElement[] = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.breadcrumb-prefix, .breadcrumb-link, .breadcrumb-current'
      )
    );
    return nodes.map((node) => node.textContent?.trim() ?? '');
  }

  it('rend le fil dans une balise nav étiquetée', () => {
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav[aria-label="Fil d\'Ariane"]');
    expect(nav).not.toBeNull();
  });

  it('affiche le groupe puis la page', async () => {
    expect(await trailAt('/admin/articles')).toEqual(['Admin', 'Contenu', 'Articles']);
  });

  it('nomme les trois pages que le mapping code en dur ignorait', async () => {
    expect(await trailAt('/admin/matches')).toEqual(['Admin', 'Compétition', 'Matchs']);
    expect(await trailAt('/admin/trophies')).toEqual(['Admin', 'Compétition', 'Palmarès']);
    expect(await trailAt('/admin/twitch-channels')).toEqual(['Admin', 'Contenu', 'Live Twitch']);
  });

  it('se met à jour à chaque navigation', async () => {
    expect(await trailAt('/admin/articles')).toEqual(['Admin', 'Contenu', 'Articles']);
    expect(await trailAt('/admin/matches')).toEqual(['Admin', 'Compétition', 'Matchs']);
  });

  it('rend la page parente cliquable depuis une sous-page', async () => {
    await router.navigateByUrl('/admin/articles/edit/42');
    fixture.detectChanges();
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector('.breadcrumb-link');
    expect(link?.textContent?.trim()).toBe('Articles');
    expect(link?.getAttribute('href')).toBe('/admin/articles');
  });

  it('marque le dernier niveau comme page courante', async () => {
    await router.navigateByUrl('/admin/articles');
    fixture.detectChanges();
    await fixture.whenStable();

    const current = fixture.nativeElement.querySelector('[aria-current="page"]');
    expect(current?.textContent?.trim()).toBe('Articles');
  });
});
