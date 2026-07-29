import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { BehaviorSubject, Observable } from 'rxjs';
import { AdminLayoutComponent } from './admin-layout.component';
import { AdminShortcutsService } from '../../../shared/services/admin-shortcuts.service';
import { AuthService } from '../../../shared/services/api/auth.service';

/** BreakpointObserver pilotable : on bascule mobile / desktop a la demande. */
class FakeBreakpointObserver {
  readonly state = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });

  observe(): Observable<BreakpointState> {
    return this.state.asObservable();
  }

  setMobile(matches: boolean): void {
    this.state.next({ matches, breakpoints: {} });
  }
}

describe('AdminLayoutComponent', () => {
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let component: AdminLayoutComponent;
  let breakpoints: FakeBreakpointObserver;

  beforeEach(async () => {
    breakpoints = new FakeBreakpointObserver();

    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: BreakpointObserver, useValue: breakpoints },
        {
          provide: AdminShortcutsService,
          useValue: {
            availableShortcuts: signal([]),
            shortcutsBySection: signal(new Map()),
          },
        },
        {
          provide: AuthService,
          useValue: {
            user: signal(null),
            role: signal(null),
            logout: jasmine.createSpy('logout'),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  /** L'element `aside` de la sidebar, tel que rendu dans le layout. */
  function sidebar(): HTMLElement {
    return fixture.nativeElement.querySelector('aside.sidebar');
  }

  // ─── Bug #1 : le drawer ferme restait dans le parcours de tabulation ───────

  it('sort le drawer fermé du parcours de tabulation en mobile', async () => {
    // Sans cette liaison, `isMobile` restait a sa valeur par defaut `false` et
    // l'attribut `inert` de la sidebar ne s'appliquait jamais : Tab envoyait
    // l'utilisateur dans des liens invisibles hors ecran.
    breakpoints.setMobile(true);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(sidebar().hasAttribute('inert')).toBeTrue();
  });

  it('laisse le drawer ouvert accessible en mobile', async () => {
    breakpoints.setMobile(true);
    component.toggleMobileMenu();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(sidebar().hasAttribute('inert')).toBeFalse();
  });

  it('laisse la sidebar accessible en desktop, même repliée', async () => {
    breakpoints.setMobile(false);
    component.toggleSidebar();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(sidebar().hasAttribute('inert')).toBeFalse();
  });

  // ─── Bascule du bouton du header ──────────────────────────────────────────

  it('ouvre le drawer en mobile plutôt que de replier', () => {
    breakpoints.setMobile(true);

    component.onHeaderToggle();

    expect(component.mobileMenuOpen()).toBeTrue();
    expect(component.sidebarCollapsed()).toBeFalse();
  });

  it('replie la sidebar en desktop plutôt que d’ouvrir le drawer', () => {
    breakpoints.setMobile(false);

    component.onHeaderToggle();

    expect(component.sidebarCollapsed()).toBeTrue();
    expect(component.mobileMenuOpen()).toBeFalse();
  });

  it('referme le drawer au passage en desktop', async () => {
    breakpoints.setMobile(true);
    component.toggleMobileMenu();
    fixture.detectChanges();
    await fixture.whenStable();

    breakpoints.setMobile(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.mobileMenuOpen()).toBeFalse();
  });
});
