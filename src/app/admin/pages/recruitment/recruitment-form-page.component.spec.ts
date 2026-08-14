import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { RecruitmentFormPageComponent } from './recruitment-form-page.component';
import { RecruitmentService } from '../../../shared/services';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { RecruitmentPost } from '../../../shared/models';

const POST = {
  id: 7,
  title: 'Coach LoL',
  type: 'Bénévole',
  description: 'Encadrer l’équipe',
  image: null,
  active: true,
  location: 'Télétravail',
  duration: null,
  missions: null,
  skills: null,
  requirements: null,
  benefits: null,
} as unknown as RecruitmentPost;

describe('RecruitmentFormPageComponent', () => {
  let fixture: ComponentFixture<RecruitmentFormPageComponent>;
  let component: RecruitmentFormPageComponent;
  let service: jasmine.SpyObj<RecruitmentService>;
  let router: jasmine.SpyObj<Router>;
  let notifier: jasmine.SpyObj<AdminNotifier>;

  /** Monte le composant avec ou sans `:id`, ce qui decide du mode. */
  function setup(id: string | null): void {
    service = jasmine.createSpyObj('RecruitmentService', [
      'getPostById',
      'createPost',
      'updatePost',
    ]);
    router = jasmine.createSpyObj('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    notifier = jasmine.createSpyObj('AdminNotifier', ['saved', 'error']);
    service.getPostById.and.returnValue(of(POST));
    service.createPost.and.returnValue(of(POST));
    service.updatePost.and.returnValue(of(POST));

    TestBed.configureTestingModule({
      imports: [RecruitmentFormPageComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RecruitmentService, useValue: service },
        { provide: Router, useValue: router },
        { provide: AdminNotifier, useValue: notifier },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
        },
      ],
    });

    fixture = TestBed.createComponent(RecruitmentFormPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('en creation', () => {
    beforeEach(() => setup(null));

    it('ne charge aucune offre', () => {
      expect(component.isEdit()).toBeFalse();
      expect(service.getPostById).not.toHaveBeenCalled();
    });

    it('refuse d’enregistrer un formulaire incomplet et marque les champs', () => {
      component.save();

      expect(service.createPost).not.toHaveBeenCalled();
      expect(component.form.get('title')?.touched).toBeTrue();
    });

    it('cree l’offre puis revient a la liste', () => {
      component.form.patchValue({ title: 'Coach', type: 'CDI', description: 'Texte' });

      component.save();

      expect(service.createPost).toHaveBeenCalled();
      expect(notifier.saved).toHaveBeenCalledWith('Offre', 'create', 'f');
      expect(router.navigate).toHaveBeenCalledWith(['/admin/recruitment']);
    });

    it('affiche un message et reste sur la page quand l’enregistrement echoue', () => {
      service.createPost.and.returnValue(throwError(() => new Error('boom')));
      component.form.patchValue({ title: 'Coach', type: 'CDI', description: 'Texte' });

      component.save();

      expect(component.error()).toBeDefined();
      expect(component.saving()).toBeFalse();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('en edition', () => {
    beforeEach(() => setup('7'));

    it('charge l’offre et remplit le formulaire', () => {
      expect(component.isEdit()).toBeTrue();
      expect(service.getPostById).toHaveBeenCalledWith(7);
      expect(component.form.get('title')?.value).toBe('Coach LoL');
    });

    it('laisse le formulaire intact apres chargement', () => {
      // Sans cela, la garde de sortie se declencherait sur une page ou
      // l'utilisateur n'a rien touche.
      expect(component.form.dirty).toBeFalse();
      expect(component.hasUnsavedChanges()).toBeFalse();
    });

    it('met a jour l’offre existante', () => {
      component.form.patchValue({ title: 'Coach senior' });

      component.save();

      expect(service.updatePost).toHaveBeenCalled();
      expect(service.updatePost.calls.mostRecent().args[0]).toBe(7);
      expect(notifier.saved).toHaveBeenCalledWith('Offre', 'edit', 'f');
    });
  });

  describe('quand l’offre est introuvable', () => {
    beforeEach(() => {
      setup('999');
      service.getPostById.and.returnValue(throwError(() => new Error('404')));
      component.loadPost();
      fixture.detectChanges();
    });

    it('affiche une erreur plutot qu’un formulaire vide', () => {
      // Un formulaire vide sur une route d'edition ferait croire a une creation,
      // et l'enregistrement echouerait sans que rien ne l'ait annonce.
      expect(component.loadError()).toBeDefined();
      expect(component.loading()).toBeFalse();
      const html = fixture.nativeElement.textContent as string;
      expect(html).not.toContain('Fiche de poste');
    });

    it('reessaie le chargement a la demande', () => {
      service.getPostById.and.returnValue(of(POST));

      component.loadPost();

      expect(component.loadError()).toBeUndefined();
      expect(component.form.get('title')?.value).toBe('Coach LoL');
    });
  });

  describe('garde de sortie', () => {
    beforeEach(() => setup(null));

    it('ne retient pas une page intacte', () => {
      expect(component.hasUnsavedChanges()).toBeFalse();
    });

    it('retient une saisie non enregistree', () => {
      component.form.patchValue({ title: 'Brouillon' });
      component.form.markAsDirty();

      expect(component.hasUnsavedChanges()).toBeTrue();
    });

    it('ne retient plus rien apres un enregistrement reussi', () => {
      // La navigation qui suit l'enregistrement ne doit pas demander de
      // confirmer l'abandon d'un travail qui vient justement d'etre sauve.
      component.form.patchValue({ title: 'Coach', type: 'CDI', description: 'Texte' });
      component.form.markAsDirty();

      component.save();

      expect(component.hasUnsavedChanges()).toBeFalse();
    });
  });
});
