import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { SponsorImagesPageComponent } from './sponsor-images-page.component';
import { SponsorsService } from '../../../shared/services/sponsors.service';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { AdminConfirmService } from '../../shared/admin-confirm.service';
import { AdminNotifier } from '../../shared/admin-notifier.service';
import { ImageLayout, type Sponsor, type SponsorImage } from '../../../shared/models';

describe('SponsorImagesPageComponent', () => {
  let component: SponsorImagesPageComponent;
  let fixture: ComponentFixture<SponsorImagesPageComponent>;
  let sponsorsService: jasmine.SpyObj<SponsorsService>;
  let confirm: jasmine.SpyObj<AdminConfirmService>;
  let notifier: jasmine.SpyObj<AdminNotifier>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let router: jasmine.SpyObj<Router>;

  const primary: SponsorImage = {
    id: 10,
    url: 'https://cdn.test/logo.png',
    alt: 'Sponsor E2E - Logo',
    isPrimary: true,
    position: 0,
  };

  function makeSponsor(images: SponsorImage[] = [primary]): Sponsor {
    return {
      id: 4,
      name: 'Sponsor Test',
      slug: 'sponsor-test',
      description: 'Partenaire historique',
      position: 0,
      active: true,
      imageLayout: ImageLayout.LAYOUT_1,
      images,
      links: [],
      startDate: null,
      endDate: null,
      createdAt: '2024-01-01T00:00:00Z',
    };
  }

  /** Monte la page sur l'identifiant donne, comme le ferait la route reelle. */
  async function setup(id = '4', sponsors: Sponsor[] = [makeSponsor()]): Promise<void> {
    const sponsorsServiceSpy = jasmine.createSpyObj('SponsorsService', [
      'loadAllSponsors',
      'addImage',
      'removeImage',
      'reorderImages',
    ]);
    const confirmSpy = jasmine.createSpyObj('AdminConfirmService', ['delete']);
    const notifierSpy = jasmine.createSpyObj('AdminNotifier', ['success', 'error', 'deleted']);
    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    routerSpy.navigate.and.returnValue(Promise.resolve(true));
    sponsorsServiceSpy.loadAllSponsors.and.returnValue(of(sponsors));
    sponsorsServiceSpy.reorderImages.and.returnValue(of(undefined));
    sponsorsServiceSpy.removeImage.and.returnValue(of(undefined));
    confirmSpy.delete.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [SponsorImagesPageComponent, NoopAnimationsModule],
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

    fixture = TestBed.createComponent(SponsorImagesPageComponent);
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
      expect(el().querySelector('.page-header h1')?.textContent).toContain(
        'Images de Sponsor Test',
      );
      expect(el().querySelector('.page-header .back-button')).toBeTruthy();
    });

    it('rend les trois emplacements', () => {
      expect(el().querySelectorAll('.image-section').length).toBe(3);
      expect(component.slots().map((slot) => slot.key)).toEqual([
        'primary',
        'secondary1',
        'secondary2',
      ]);
    });

    it('place l’image existante dans l’emplacement principal', () => {
      expect(component.primaryImage()?.id).toBe(10);
      const img = el().querySelector<HTMLImageElement>(
        '[data-slot="primary"] .current-image img',
      );
      expect(img?.getAttribute('src')).toBe('https://cdn.test/logo.png');
    });

    it('offre une zone de téléversement pour chaque emplacement libre', () => {
      expect(el().querySelectorAll('app-image-upload').length).toBe(2);
    });

  });

  it('trie les images par position', async () => {
    const second: SponsorImage = {
      id: 11,
      url: 'https://cdn.test/b.png',
      alt: null,
      isPrimary: false,
      position: 1,
    };
    await setup('4', [makeSponsor([second, primary])]);
    expect(component.images().map((i) => i.id)).toEqual([10, 11]);
  });

  // ─── Sponsor inconnu / panne de chargement ─────────────────────────────────

  describe('sponsor inconnu', () => {
    it('rend un état d’erreur bloquant plutôt qu’une galerie vide', async () => {
      await setup('999');
      expect(component.loadError()).toBe("Ce sponsor n'existe pas.");
      expect(el().querySelector('.error-state')).toBeTruthy();
      expect(el().querySelectorAll('.image-section').length).toBe(0);
    });

    it('propose un réessai qui recharge sans rechargement de page', async () => {
      await setup('999');
      const retry = el().querySelector<HTMLButtonElement>('[data-testid="error-retry"]');
      expect(retry).toBeTruthy();

      sponsorsService.loadAllSponsors.and.returnValue(of([makeSponsor(), { ...makeSponsor(), id: 999, name: 'Retrouvé' }]));
      retry!.click();
      await settle();

      expect(component.loadError()).toBeUndefined();
      expect(el().querySelector('.page-header h1')?.textContent).toContain('Images de Retrouvé');
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
  });

  // ─── Ajout d'une image ─────────────────────────────────────────────────────

  describe('ajout d’une image', () => {
    beforeEach(async () => {
      await setup();
      sponsorsService.addImage.and.returnValue(
        of({ id: 12, url: 'https://cdn.test/new.png', alt: null, isPrimary: false, position: 3 }),
      );
    });

    it('rattache l’image au sponsor puis la place dans son emplacement', async () => {
      component.onImageUploaded('https://cdn.test/new.png', 'secondary1');
      await settle();

      expect(sponsorsService.addImage).toHaveBeenCalledWith(4, {
        url: 'https://cdn.test/new.png',
        alt: 'Sponsor Test - Image',
        isPrimary: false,
      });
      expect(sponsorsService.reorderImages).toHaveBeenCalled();
      expect(notifier.success).toHaveBeenCalledWith('Image ajoutée');
    });

    it('marque l’image comme principale sur l’emplacement principal', async () => {
      component.onImageUploaded('https://cdn.test/new.png', 'primary');
      await settle();

      expect(sponsorsService.addImage).toHaveBeenCalledWith(
        4,
        jasmine.objectContaining({ isPrimary: true, alt: 'Sponsor Test - Logo' }),
      );
    });

    it('recharge le sponsor après un ajout réussi', async () => {
      const before = sponsorsService.loadAllSponsors.calls.count();
      component.onImageUploaded('https://cdn.test/new.png', 'secondary1');
      await settle();

      expect(sponsorsService.loadAllSponsors.calls.count()).toBe(before + 1);
    });

    it('signale l’échec de l’ajout par le notificateur, sans snackbar direct', async () => {
      sponsorsService.addImage.and.returnValue(throwError(() => new Error('boom')));
      component.onImageUploaded('https://cdn.test/new.png', 'secondary1');
      await settle();

      expect(notifier.error).toHaveBeenCalledWith("Erreur lors de l'ajout de l'image");
      expect(snackBar.open).not.toHaveBeenCalled();
      expect(component.saving()).toBe(false);
    });

    it('ne laisse plus l’échec de positionnement passer sous silence', async () => {
      // Le dialogue avalait cette seconde erreur : l'image atterrissait dans le
      // mauvais emplacement sans que rien ne le dise.
      sponsorsService.reorderImages.and.returnValue(throwError(() => new Error('boom')));
      component.onImageUploaded('https://cdn.test/new.png', 'secondary2');
      await settle();

      expect(notifier.error).toHaveBeenCalledWith(
        "Image ajoutée, mais son emplacement n'a pas pu être enregistré",
      );
    });
  });

  // ─── Suppression ───────────────────────────────────────────────────────────

  describe('suppression d’une image', () => {
    beforeEach(async () => {
      await setup();
    });

    it('demande confirmation avant de supprimer', async () => {
      component.removeImage(primary);
      await settle();

      expect(confirm.delete).toHaveBeenCalledWith('cette image');
      expect(sponsorsService.removeImage).toHaveBeenCalledWith(4, 10);
      expect(notifier.deleted).toHaveBeenCalledWith('Image', 'f');
    });

    it('n’appelle pas l’API quand la confirmation est refusée', async () => {
      confirm.delete.and.returnValue(of(false));
      component.removeImage(primary);
      await settle();

      expect(sponsorsService.removeImage).not.toHaveBeenCalled();
    });

    it('signale l’échec par le notificateur, sans snackbar direct', async () => {
      sponsorsService.removeImage.and.returnValue(throwError(() => new Error('boom')));
      component.removeImage(primary);
      await settle();

      expect(notifier.error).toHaveBeenCalledWith('Erreur lors de la suppression');
      expect(snackBar.open).not.toHaveBeenCalled();
    });
  });

  // ─── Garde de sortie ───────────────────────────────────────────────────────

  describe('garde de sortie', () => {
    beforeEach(async () => {
      await setup();
    });

    it('laisse partir une page au repos : rien n’y est en brouillon', () => {
      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('retient pendant qu’une image part vers le serveur', () => {
      component.saving.set(true);
      expect(component.hasUnsavedChanges()).toBe(true);
    });

    it('retient pendant un téléversement en vol', () => {
      // L'etat vit dans la zone de televersement, pas dans un formulaire : c'est
      // la seule fenetre ou du travail se perd sur cette page.
      const zones = fixture.debugElement.queryAll(By.directive(ImageUploadComponent));
      expect(zones.length).toBe(2);

      (zones[0].componentInstance as ImageUploadComponent).uploading.set(true);
      expect(component.hasUnsavedChanges()).toBe(true);

      (zones[0].componentInstance as ImageUploadComponent).uploading.set(false);
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
