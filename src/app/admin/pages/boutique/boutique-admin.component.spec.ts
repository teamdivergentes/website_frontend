import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { BoutiqueAdminComponent, eurosToCents } from './boutique-admin.component';
import { ShopAdminService } from '../../../shared/services/shop-admin.service';
import { AdminShopProduct, ShopSettings } from '../../../shared/models/shop-admin.model';

const PRODUCT: AdminShopProduct = {
  id: 1,
  slug: 'maillot-2026-joker',
  name: 'Maillot 2026 — DVG × Joker',
  shortDescription: null,
  description: null,
  priceCents: 4990,
  imageFront: 'front.png',
  imageBack: 'back.png',
  imageCard: null,
  allowFlocking: true,
  flockingFeeCents: 500,
  flockingTopPct: 32,
  flockingLeftPct: 50,
  teamId: 1,
  active: true,
  position: 0,
  sizes: [{ id: 1, label: 'M', position: 0 }],
};

const SANS_VISUEL: AdminShopProduct = { ...PRODUCT, id: 2, imageFront: null, active: false };

const SETTINGS: ShopSettings = {
  id: 1,
  shippingStandardCents: 500,
  shippingExpressCents: 1000,
  freeShippingThresholdCents: 12000,
  costProductionCents: 1600,
  costPartnerCents: 700,
  costPartnerEnabled: false,
  costEcommerceCents: 300,
  costFlockingCents: 0,
  costShippingStandardCents: 900,
  costShippingExpressCents: 1200,
  currency: 'eur',
  ordersNotifyEmail: 'boutique@dvg.fr',
  shopEnabled: false,
};

describe('BoutiqueAdminComponent', () => {
  let fixture: ComponentFixture<BoutiqueAdminComponent>;
  let component: BoutiqueAdminComponent;
  let service: jasmine.SpyObj<ShopAdminService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let dialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    service = jasmine.createSpyObj<ShopAdminService>('ShopAdminService', [
      'findAll',
      'create',
      'update',
      'remove',
      'getSettings',
      'updateSettings',
    ]);
    service.findAll.and.returnValue(of([PRODUCT, SANS_VISUEL]));
    service.getSettings.and.returnValue(of(SETTINGS));
    service.update.and.returnValue(of(PRODUCT));
    service.updateSettings.and.returnValue(of(SETTINGS));
    service.remove.and.returnValue(of(undefined));

    snackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [BoutiqueAdminComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        { provide: ShopAdminService, useValue: service },
        { provide: MatSnackBar, useValue: snackBar },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BoutiqueAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('charge le catalogue et les réglages', () => {
    expect(component.products().length).toBe(2);
    expect(component.settings()).toEqual(SETTINGS);
  });

  it('affiche les montants en euros', () => {
    expect(component.form.shippingStandard()).toBe('5.00');
    expect(component.form.notifyEmail()).toBe('boutique@dvg.fr');
  });

  describe('publication', () => {
    it('refuse de publier un produit sans visuel de face', () => {
      // Sinon la vitrine afficherait une fiche produit vide.
      component.toggleActive(SANS_VISUEL, true);

      expect(service.update).not.toHaveBeenCalled();
      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('visuel de face'),
        'Fermer',
        jasmine.anything(),
      );
    });

    it('autorise la dépublication d’un produit sans visuel', () => {
      component.toggleActive(SANS_VISUEL, false);
      expect(service.update).toHaveBeenCalledWith(2, { active: false });
    });

    it('publie un produit disposant d’un visuel', () => {
      component.toggleActive(PRODUCT, true);
      expect(service.update).toHaveBeenCalledWith(1, { active: true });
    });
  });

  describe('réglages', () => {
    it('convertit les euros saisis en centimes', () => {
      component.form.shippingStandard.set('7,50');
      component.form.notifyEmail.set(' commandes@dvg.fr ');

      component.saveSettings();

      expect(service.updateSettings).toHaveBeenCalledWith({
        shippingStandardCents: 750,
        shippingExpressCents: 1000,
        freeShippingThresholdCents: 12000,
        costProductionCents: 1600,
        costPartnerCents: 700,
        costPartnerEnabled: false,
        costEcommerceCents: 300,
        costFlockingCents: 0,
        costShippingStandardCents: 900,
        costShippingExpressCents: 1200,
        ordersNotifyEmail: 'commandes@dvg.fr',
      });
    });

    it('refuse une saisie de montant illisible', () => {
      component.form.shippingStandard.set('cinq euros');

      component.saveSettings();

      expect(service.updateSettings).not.toHaveBeenCalled();
    });

    it('remonte le message d’erreur du serveur', () => {
      service.updateSettings.and.returnValue(
        throwError(() => ({ error: { message: "L'adresse est invalide" } })),
      );

      component.saveSettings();

      expect(snackBar.open).toHaveBeenCalledWith(
        "L'adresse est invalide",
        'Fermer',
        jasmine.anything(),
      );
      expect(component.savingSettings()).toBeFalse();
    });

    it('bascule l’ouverture de la boutique', () => {
      component.toggleShop(true);
      expect(service.updateSettings).toHaveBeenCalledWith({ shopEnabled: true });
    });
  });

  describe('suppression', () => {
    it('ne supprime pas si la confirmation est refusée', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(false) } as never);

      component.confirmDelete(PRODUCT);

      expect(service.remove).not.toHaveBeenCalled();
    });

    it('supprime après confirmation', () => {
      dialog.open.and.returnValue({ afterClosed: () => of(true) } as never);

      component.confirmDelete(PRODUCT);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});

describe('eurosToCents', () => {
  it('convertit les formats courants', () => {
    expect(eurosToCents('5.90')).toBe(590);
    expect(eurosToCents('5,90')).toBe(590);
    expect(eurosToCents('12')).toBe(1200);
    expect(eurosToCents(' 0 ')).toBe(0);
  });

  it('distingue une saisie illisible de zéro', () => {
    // Retourner NaN forcerait l'appelant à un test supplémentaire facile à oublier.
    expect(eurosToCents('abc')).toBeNull();
    expect(eurosToCents('')).toBeNull();
    expect(eurosToCents('-5')).toBeNull();
    expect(eurosToCents('5.999')).toBeNull();
  });
});
