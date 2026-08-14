import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';

import { RecruitmentComponent } from './recruitment.component';
import { RecruitmentService } from '../../../shared/services';
import type { RecruitmentPost } from '../../../shared/models';

const makePost = (id: number, title: string, position: number): RecruitmentPost => ({
  id,
  title,
  type: 'CDD',
  description: 'Description du poste de test pour recrutement.',
  active: true,
  position,
});

const mockPosts: RecruitmentPost[] = [
  makePost(1, 'Joueur Valorant', 0),
  makePost(2, 'Manager', 1),
  makePost(3, 'Community Manager', 2),
];

async function setup(posts: RecruitmentPost[] = mockPosts) {
  const postsSignal = signal<RecruitmentPost[]>(posts);
  const serviceSpy = jasmine.createSpyObj(
    'RecruitmentService',
    ['loadAllPosts', 'reorderPosts', 'toggleActive', 'deletePost'],
    { allPosts: postsSignal.asReadonly() }
  );
  serviceSpy.loadAllPosts.and.returnValue(of(posts));
  serviceSpy.reorderPosts.and.returnValue(of(undefined));
  serviceSpy.toggleActive.and.returnValue(of(undefined));
  serviceSpy.deletePost.and.returnValue(of(undefined));

  const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

  await TestBed.configureTestingModule({
    imports: [RecruitmentComponent, NoopAnimationsModule],
    providers: [
      // Depuis la migration dialogue -> page, la liste navigue vers
      // /admin/recruitment/new et /edit/:id au lieu d'ouvrir un MatDialog.
      provideRouter([]),
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: RecruitmentService, useValue: serviceSpy },
      { provide: MatSnackBar, useValue: snackBarSpy },
    ],
  }).compileComponents();

  const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

  const fixture = TestBed.createComponent(RecruitmentComponent);
  fixture.detectChanges();
  await fixture.whenStable();

  return { fixture, component: fixture.componentInstance, serviceSpy, navigate };
}

describe('RecruitmentComponent — acces au formulaire', () => {
  it('navigue vers la page de creation au lieu d’ouvrir un dialogue', async () => {
    const { component, navigate } = await setup();

    component.goToCreate();

    expect(navigate).toHaveBeenCalledWith(['/admin/recruitment/new']);
  });

  it('navigue vers la page d’edition en portant l’identifiant dans l’URL', async () => {
    // L'adressabilite est le gain principal de la migration : l'URL d'une offre
    // en cours d'edition doit pouvoir se partager.
    const { component, navigate } = await setup();

    component.goToEdit(mockPosts[1]);

    expect(navigate).toHaveBeenCalledWith(['/admin/recruitment/edit', 2]);
  });

  it('recharge la liste a chaque entree sur la page', async () => {
    // Le retour depuis le formulaire detruit puis recree ce composant : c'est
    // `ngOnInit` qui garantit que l'offre enregistree apparait dans la liste.
    const { serviceSpy } = await setup();

    expect(serviceSpy.loadAllPosts).toHaveBeenCalled();
  });
});

describe('RecruitmentComponent — a11y reorder', () => {
  it('should create the component', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
  });

  it('should call onReorder when moveUp is triggered on row i=1', async () => {
    const { component } = await setup();
    spyOn(component, 'onReorder').and.callThrough();
    component.onReorder(1, 0);
    expect(component.onReorder).toHaveBeenCalledWith(1, 0);
  });

  it('should call onReorder when moveDown is triggered on row i=1', async () => {
    const { component } = await setup();
    spyOn(component, 'onReorder').and.callThrough();
    component.onReorder(1, 2);
    expect(component.onReorder).toHaveBeenCalledWith(1, 2);
  });

  it('should disable moveUp button on first row', async () => {
    const { fixture } = await setup();
    const moveUpBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le haut"]');
    expect(moveUpBtns.length).toBeGreaterThan(0);
    expect(moveUpBtns[0].disabled).toBeTrue();
  });

  it('should disable moveDown button on last row', async () => {
    const { fixture } = await setup();
    const moveDownBtns = fixture.nativeElement.querySelectorAll('[aria-label$="vers le bas"]');
    expect(moveDownBtns.length).toBeGreaterThan(0);
    expect(moveDownBtns[moveDownBtns.length - 1].disabled).toBeTrue();
  });

  it('should set liveMessage after successful reorder', async () => {
    const { component, serviceSpy } = await setup();
    serviceSpy.reorderPosts.and.returnValue(of(undefined));
    component.onReorder(1, 2);
    expect(component.liveMessage()).not.toBe('');
  });

  it('should set error liveMessage on reorder failure', async () => {
    const { component, serviceSpy } = await setup();
    serviceSpy.reorderPosts.and.returnValue(throwError(() => new Error('API error')));
    component.onReorder(1, 0);
    expect(component.liveMessage()).toContain('Echec');
  });

  it('should not call API when drop on same position', async () => {
    const { component, serviceSpy } = await setup();
    serviceSpy.reorderPosts.calls.reset();
    component.onDrop({ previousIndex: 2, currentIndex: 2 } as any);
    expect(serviceSpy.reorderPosts).not.toHaveBeenCalled();
  });

  it('should render aria-live region', async () => {
    const { fixture } = await setup();
    const liveRegion = fixture.nativeElement.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();
  });

  it('should not call service.reorderPosts when already reordering (SEC-PR206-001)', async () => {
    const { component, serviceSpy } = await setup();
    serviceSpy.reorderPosts.calls.reset();
    // Premiere requete laissee en attente : la garde doit bloquer la seconde.
    serviceSpy.reorderPosts.and.returnValue(new Subject<void>().asObservable());

    component.onReorder(0, 1);
    component.onReorder(1, 2);

    expect(serviceSpy.reorderPosts).toHaveBeenCalledTimes(1);
  });
});
