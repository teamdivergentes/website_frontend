import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { SponsorLinksPageComponent } from './sponsor-links-page.component';
import { SponsorsService } from '../../../shared/services/sponsors.service';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { ImageLayout, LinkType, type Sponsor, type SponsorLink } from '../../../shared/models';

describe('SponsorLinksPageComponent', () => {
  let component: SponsorLinksPageComponent;
  let fixture: ComponentFixture<SponsorLinksPageComponent>;
  let sponsorsService: jasmine.SpyObj<SponsorsService>;
  let confirm: jasmine.SpyObj<AdminConfirmService>;
  let notifier: jasmine.SpyObj<AdminNotifier>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: jasmine.SpyObj<Router>;

  const website: SponsorLink = {
    id: 7,
    url: 'https://exemple.com',
    label: 'Site officiel',
    type: LinkType.WEBSITE,
    isPrimary: true,
  };

  const twitter: SponsorLink = {
    id: 8,
    url: 'https://twitter.com/sponsor',
    label: 'Twitter',
    type: LinkType.TWITTER,
    isPrimary: false,
  };

  function makeSponsor(links: SponsorLink[] = [website]): Sponsor {
    return {
      id: 4,
      name: 'Sponsor Test',
      slug: 'sponsor-test',
      description: 'Partenaire historique',
      position: 0,
      active: true,
      imageLayout: ImageLayout.LAYOUT_1,
      images: [],
      links,
      startDate: null,
      endDate: null,
      createdAt: '2024-01-01T00:00:00Z',
    };
  }

  /** Monte la page sur l'identifiant donne, comme le ferait la route reelle. */
  async function setup(id = '4', sponsors: Sponsor[] = [makeSponsor()]): Promise<void> {
    const sponsorsServiceSpy = jasmine.createSpyObj('SponsorsService', [
      'loadAllSponsors',
      'addLink',
      'updateLink',
      'removeLink',
    ]);
    const confirmSpy = jasmine.createSpyObj('AdminConfirmService', ['delete']);
    const notifierSpy = jasmine.createSpyObj('AdminNotifier', ['success', 'error', 'saved', 'deleted']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    routerSpy.navigate.and.returnValue(Promise.resolve(true));
    sponsorsServiceSpy.loadAllSponsors.and.returnValue(of(sponsors));
    sponsorsServiceSpy.addLink.and.returnValue(of({ ...twitter, id: 12 }));
    sponsorsServiceSpy.updateLink.and.returnValue(of(website));
    sponsorsServiceSpy.removeLink.and.returnValue(of(undefined));
    confirmSpy.delete.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [SponsorLinksPageComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SponsorsService, useValue: sponsorsServiceSpy },
        { provide: AdminConfirmService, useValue: confirmSpy },
        { provide: AdminNotifier, useValue: notifierSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id }) } },
        },
      ],
    }).compileComponents();

    sponsorsService = TestBed.inject(SponsorsService) as jasmine.SpyObj<SponsorsService>;
    confirm = TestBed.inject(AdminConfirmService) as jasmine.SpyObj<AdminConfirmService>;
    notifier = TestBed.inject(AdminNotifier) as jasmine.SpyObj<AdminNotifier>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    fixture = TestBed.createComponent(SponsorLinksPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  function el(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  async function settle(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
  }

  /** Remplit le formulaire comme le ferait une saisie, `dirty` compris. */
  function fillForm(values: Partial<Record<string, unknown>>): void {
    for (const [key, value] of Object.entries(values)) {
      const control = component.form.get(key)!;
      control.setValue(value);
      control.markAsDirty();
    }
  }

  // ─── Chargement ────────────────────────────────────────────────────────────

  describe('chargement', () => {
    beforeEach(async () => {
      await setup();
    });

    it('résout le sponsor désigné par l’URL', () => {
      expect(sponsorsService.loadAllSponsors).toHaveBeenCalled();
      expect(component.sponsor()?.id).toBe(4);
      expect(component.loadError()).toBeUndefined();
    });

    it('affiche le nom du sponsor dans l’en-tête, avec un bouton de retour', () => {
      expect(el().querySelector('.page-header h1')?.textContent).toContain('Liens de Sponsor Test');
      expect(el().querySelector('.page-header .back-button')).toBeTruthy();
    });

    it('rend la liste des liens du sponsor', () => {
      expect(component.links().length).toBe(1);
      const item = el().querySelector('.link-item');
      expect(item?.textContent).toContain('Site officiel');
      expect(item?.textContent).toContain('Site web');
      expect(item?.classList.contains('primary')).toBe(true);
    });

    it('ouvre en mode liste : le formulaire n’est pas monté', () => {
      expect(component.mode()).toBe('list');
      expect(el().querySelector('.form-section')).toBeNull();
    });

  });

  it('rend un état vide quand le sponsor n’a aucun lien', async () => {
    await setup('4', [makeSponsor([])]);
    expect(el().querySelector('.empty-state')).toBeTruthy();
    expect(el().querySelectorAll('.link-item').length).toBe(0);
  });

  it('rend chaque lien du sponsor', async () => {
    await setup('4', [makeSponsor([website, twitter])]);
    expect(el().querySelectorAll('.link-item').length).toBe(2);
    expect(el().textContent).toContain('Twitter');
  });

  // ─── Sponsor inconnu / panne de chargement ─────────────────────────────────

  describe('sponsor inconnu', () => {
    it('rend un état d’erreur bloquant plutôt qu’une liste vide', async () => {
      await setup('999');
      expect(component.loadError()).toBe("Ce sponsor n'existe pas.");
      expect(el().querySelector('.error-state')).toBeTruthy();
      expect(el().querySelector('.empty-state')).toBeNull();
      expect(el().querySelectorAll('.link-item').length).toBe(0);
    });

    it('propose un réessai qui recharge sans rechargement de page', async () => {
      await setup('999');
      const retry = el().querySelector<HTMLButtonElement>('[data-testid="error-retry"]');
      expect(retry).toBeTruthy();

      sponsorsService.loadAllSponsors.and.returnValue(
        of([makeSponsor(), { ...makeSponsor(), id: 999, name: 'Retrouvé' }]),
      );
      retry!.click();
      await settle();

      expect(component.loadError()).toBeUndefined();
      expect(el().querySelector('.page-header h1')?.textContent).toContain('Liens de Retrouvé');
    });

    it('traite un identifiant non numérique comme un sponsor inconnu', async () => {
      await setup('abc');
      expect(component.loadError()).toBe("Ce sponsor n'existe pas.");
    });

    it('rend un état d’erreur quand l’API est en panne', async () => {
      await setup();
      sponsorsService.loadAllSponsors.and.returnValue(throwError(() => new Error('boom')));
      component.loadSponsor();
      await settle();

      expect(component.loadError()).toBe('Impossible de charger ce sponsor.');
      expect(el().querySelector('.error-state')).toBeTruthy();
    });

    it('signale l’échec d’un rafraîchissement au lieu de l’avaler', async () => {
      // Le dialogue se fermait apres chaque mutation : il n'avait rien a
      // rafraichir, donc aucun gestionnaire ici. En page, l'echec doit parler.
      await setup();
      component.startCreate();
      fillForm({ label: 'Discord', url: 'https://discord.gg/abc', type: LinkType.DISCORD });
      sponsorsService.loadAllSponsors.and.returnValue(throwError(() => new Error('boom')));
      component.onSubmit();
      await settle();

      expect(notifier.error).toHaveBeenCalledWith('Impossible de rafraîchir les liens du sponsor');
      expect(component.loadError()).toBeUndefined();
    });
  });

  // ─── Ajout d'un lien ───────────────────────────────────────────────────────

  describe('ajout d’un lien', () => {
    beforeEach(async () => {
      await setup();
    });

    it('ouvre le formulaire à la demande', async () => {
      component.startCreate();
      await settle();

      expect(component.mode()).toBe('create');
      expect(el().querySelector('.form-section')).toBeTruthy();
      expect(el().querySelector('.form-section h2')?.textContent).toContain('Ajouter un lien');
    });

    it('enregistre le lien puis revient à la liste', async () => {
      component.startCreate();
      fillForm({ label: 'Twitter', url: 'https://twitter.com/sponsor', type: LinkType.TWITTER });
      component.onSubmit();
      await settle();

      expect(sponsorsService.addLink).toHaveBeenCalledWith(4, {
        label: 'Twitter',
        url: 'https://twitter.com/sponsor',
        type: LinkType.TWITTER,
        isPrimary: false,
      });
      expect(notifier.saved).toHaveBeenCalledWith('Lien', 'create');
      expect(component.mode()).toBe('list');
    });

    it('recharge le sponsor après un ajout réussi', async () => {
      const before = sponsorsService.loadAllSponsors.calls.count();
      component.startCreate();
      fillForm({ label: 'Twitter', url: 'https://twitter.com/sponsor' });
      component.onSubmit();
      await settle();

      expect(sponsorsService.loadAllSponsors.calls.count()).toBe(before + 1);
    });

    it('signale l’échec par le notificateur, sans snackbar direct', async () => {
      sponsorsService.addLink.and.returnValue(throwError(() => new Error('boom')));
      component.startCreate();
      fillForm({ label: 'Twitter', url: 'https://twitter.com/sponsor' });
      component.onSubmit();
      await settle();

      expect(notifier.error).toHaveBeenCalledWith("Erreur lors de l'enregistrement du lien");
      expect(snackBar.open).not.toHaveBeenCalled();
      expect(component.saving()).toBe(false);
      // L'ecran reste sur le formulaire : la saisie n'est pas perdue.
      expect(component.mode()).toBe('create');
    });

    it('vide le formulaire au passage liste -> ajout', async () => {
      // `editingLink` vaut `undefined` avant comme apres : l'effet de
      // synchronisation ne se rejoue pas, la saisie precedente resterait a
      // l'ecran et la garde la prendrait pour un brouillon.
      component.startCreate();
      fillForm({ label: 'Brouillon', url: 'https://brouillon.test' });
      component.cancelForm();
      await settle();

      component.startCreate();
      await settle();

      expect(component.form.get('label')?.value).toBe('');
      expect(component.form.get('url')?.value).toBe('');
      expect(component.form.get('type')?.value).toBe(LinkType.WEBSITE);
      expect(component.form.dirty).toBe(false);
    });

    it('vide aussi le formulaire au passage édition -> ajout', async () => {
      component.startEdit(website);
      await settle();
      expect(component.form.get('label')?.value).toBe('Site officiel');

      component.startCreate();
      await settle();

      expect(component.form.get('label')?.value).toBe('');
      expect(component.form.get('isPrimary')?.value).toBe(false);
    });
  });

  // ─── Édition ───────────────────────────────────────────────────────────────

  describe('édition d’un lien', () => {
    beforeEach(async () => {
      await setup();
    });

    it('pré-remplit le formulaire avec le lien choisi', async () => {
      component.startEdit(website);
      await settle();

      expect(component.mode()).toBe('edit');
      expect(component.form.value).toEqual({
        label: 'Site officiel',
        url: 'https://exemple.com',
        type: LinkType.WEBSITE,
        isPrimary: true,
      });
      expect(el().querySelector('.form-section h2')?.textContent).toContain('Modifier le lien');
    });

    it('appelle la mise à jour, pas la création', async () => {
      component.startEdit(website);
      await settle();

      fillForm({ label: 'Site web officiel' });
      component.onSubmit();
      await settle();

      expect(sponsorsService.updateLink).toHaveBeenCalledWith(
        4,
        7,
        jasmine.objectContaining({ label: 'Site web officiel' }),
      );
      expect(sponsorsService.addLink).not.toHaveBeenCalled();
      expect(notifier.saved).toHaveBeenCalledWith('Lien', 'edit');
    });
  });

  // ─── Validation ────────────────────────────────────────────────────────────

  describe('validation', () => {
    beforeEach(async () => {
      await setup();
      component.startCreate();
      await settle();
    });

    it('refuse un formulaire vide et marque les champs comme touchés', async () => {
      component.onSubmit();
      await settle();

      expect(sponsorsService.addLink).not.toHaveBeenCalled();
      expect(component.form.get('label')?.touched).toBe(true);
      expect(component.form.get('url')?.touched).toBe(true);
    });

    it('refuse une URL sans schéma', () => {
      // Le dialogue n'avait que `required` : "exemple.com" passait et donnait un
      // lien relatif casse sur la page publique.
      fillForm({ label: 'Site', url: 'exemple.com' });
      expect(component.form.get('url')?.hasError('adminUrl')).toBe(true);
      expect(component.form.invalid).toBe(true);
    });

    it('accepte une URL http ou https', () => {
      fillForm({ label: 'Site', url: 'http://exemple.com' });
      expect(component.form.get('url')?.valid).toBe(true);

      fillForm({ url: 'https://exemple.com/promo' });
      expect(component.form.get('url')?.valid).toBe(true);
    });

    it('propose un exemple d’URL adapté au type choisi', async () => {
      expect(component.urlPlaceholder()).toBe('https://exemple.com');
      component.form.get('type')!.setValue(LinkType.DISCORD);
      await settle();
      expect(component.urlPlaceholder()).toBe('https://discord.gg/codeinvite');
    });
  });

  // ─── Suppression ───────────────────────────────────────────────────────────

  describe('suppression d’un lien', () => {
    beforeEach(async () => {
      await setup();
    });

    it('demande confirmation avant de supprimer', async () => {
      component.removeLink(website);
      await settle();

      expect(confirm.delete).toHaveBeenCalledWith('ce lien', 'Site officiel');
      expect(sponsorsService.removeLink).toHaveBeenCalledWith(4, 7);
      expect(notifier.deleted).toHaveBeenCalledWith('Lien');
    });

    it('n’appelle pas l’API quand la confirmation est refusée', async () => {
      confirm.delete.and.returnValue(of(false));
      component.removeLink(website);
      await settle();

      expect(sponsorsService.removeLink).not.toHaveBeenCalled();
    });

    it('signale l’échec par le notificateur, sans snackbar direct', async () => {
      sponsorsService.removeLink.and.returnValue(throwError(() => new Error('boom')));
      component.removeLink(website);
      await settle();

      expect(notifier.error).toHaveBeenCalledWith('Erreur lors de la suppression du lien');
      expect(snackBar.open).not.toHaveBeenCalled();
    });

    it('referme le formulaire quand le lien supprimé était en cours d’édition', async () => {
      component.startEdit(website);
      await settle();

      component.removeLink(website);
      await settle();

      expect(component.mode()).toBe('list');
      expect(component.editingLink()).toBeUndefined();
    });
  });

  // ─── Garde de sortie ───────────────────────────────────────────────────────

  describe('garde de sortie', () => {
    beforeEach(async () => {
      await setup();
    });

    it('laisse partir depuis la liste', () => {
      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('laisse partir un formulaire ouvert mais intact', async () => {
      component.startCreate();
      await settle();
      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('retient sur un formulaire modifié', async () => {
      component.startCreate();
      fillForm({ label: 'Brouillon' });
      await settle();
      expect(component.hasUnsavedChanges()).toBe(true);
    });

    it('laisse repartir une fois le formulaire refermé', async () => {
      component.startCreate();
      fillForm({ label: 'Brouillon' });
      component.cancelForm();
      await settle();
      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('laisse repartir après un enregistrement réussi', async () => {
      component.startCreate();
      fillForm({ label: 'Twitter', url: 'https://twitter.com/sponsor' });
      component.onSubmit();
      await settle();

      expect(component.hasUnsavedChanges()).toBe(false);
    });
  });

  // ─── Retour ────────────────────────────────────────────────────────────────

  it('revient à la liste des sponsors', async () => {
    await setup();
    component.backToSponsors();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/sponsors']);
  });
});
