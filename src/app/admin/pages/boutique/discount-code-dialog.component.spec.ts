import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { DiscountCodeDialogComponent } from './discount-code-dialog.component';
import { ShopAdminService } from '../../../shared/services/shop-admin.service';
import { AdminDiscountCode } from '../../../shared/models/shop-admin.model';

const CODE: AdminDiscountCode = {
  id: 7,
  code: 'BIENVENUE',
  type: 'FIXED',
  value: 500,
  minSubtotalCents: null,
  startsAt: null,
  endsAt: null,
  maxUses: null,
  usedCount: 0,
  reservedCount: 0,
  active: true,
  createdAt: '2026-08-08T10:00:00.000Z',
};

describe('DiscountCodeDialogComponent', () => {
  let fixture: ComponentFixture<DiscountCodeDialogComponent>;
  let component: DiscountCodeDialogComponent;
  let service: jasmine.SpyObj<ShopAdminService>;
  const dialogRef = jasmine.createSpyObj<MatDialogRef<DiscountCodeDialogComponent>>('ref', [
    'close',
  ]);

  const build = (discount: AdminDiscountCode | null) => {
    TestBed.resetTestingModule();
    service = jasmine.createSpyObj<ShopAdminService>('ShopAdminService', [
      'createDiscountCode',
      'updateDiscountCode',
      'suggestDiscountCode',
    ]);
    service.createDiscountCode.and.returnValue(of(CODE));
    service.updateDiscountCode.and.returnValue(of(CODE));
    service.suggestDiscountCode.and.returnValue(of({ code: 'K7QF2MZP' }));

    TestBed.configureTestingModule({
      imports: [DiscountCodeDialogComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ShopAdminService, useValue: service },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { discount } },
      ],
    });
    fixture = TestBed.createComponent(DiscountCodeDialogComponent);
    component = fixture.componentInstance;
    return component;
  };

  beforeEach(() => {
    dialogRef.close.calls.reset();
    build(null);
  });

  describe('validation', () => {
    it('refuse un code hors charset', () => {
      component.code.set('CODE PROMO');

      expect(component.validationError()).toContain('lettres, chiffres et tirets');
      expect(component.canSave()).toBeFalse();
    });

    it('refuse un pourcentage au-delà de 100 %', () => {
      component.code.set('RENTREE');
      component.type.set('PERCENTAGE');
      component.value.set('120');

      expect(component.validationError()).toContain('100');
    });

    it('accepte 100 % : c’est une remise totale, pas une erreur', () => {
      component.code.set('CADEAU');
      component.type.set('PERCENTAGE');
      component.value.set('100');

      expect(component.validationError()).toBeUndefined();
    });

    it('refuse une fenêtre inversée', () => {
      component.code.set('RENTREE');
      component.value.set('500');
      component.startsAt.set('2026-09-01');
      component.endsAt.set('2026-08-01');

      expect(component.validationError()).toContain('postérieure');
    });

    it('accepte un quota vide : illimité', () => {
      component.code.set('RENTREE');
      component.value.set('500');
      component.maxUses.set('');

      expect(component.validationError()).toBeUndefined();
    });

    it('refuse un quota nul, qui n’est pas la même chose qu’un quota absent', () => {
      component.code.set('RENTREE');
      component.value.set('500');
      component.maxUses.set('0');

      expect(component.validationError()).toContain('supérieur à zéro');
    });
  });

  describe('génération', () => {
    it('remplit le champ avec le code proposé par le serveur', () => {
      component.generate();

      expect(component.code()).toBe('K7QF2MZP');
    });

    it('laisse modifier le code proposé', () => {
      component.generate();
      component.code.set('AUTRE');

      expect(component.code()).toBe('AUTRE');
    });

    it('invite à saisir un code à la main si la génération échoue', () => {
      service.suggestDiscountCode.and.returnValue(throwError(() => new Error('down')));

      component.generate();

      expect(component.error()).toContain('à la main');
    });
  });

  describe('enregistrement', () => {
    it('envoie le code normalisé en majuscules', () => {
      component.code.set('bienvenue');
      component.value.set('500');

      component.save();

      expect(service.createDiscountCode).toHaveBeenCalledWith(
        jasmine.objectContaining({ code: 'BIENVENUE' }),
      );
    });

    it('envoie null plutôt qu’un champ absent pour retirer une borne', () => {
      // Un champ omis laisserait la borne précédente en place.
      component.code.set('BIENVENUE');
      component.value.set('500');

      component.save();

      const [dto] = service.createDiscountCode.calls.mostRecent().args;
      expect(dto.minSubtotalCents).toBeNull();
      expect(dto.startsAt).toBeNull();
      expect(dto.maxUses).toBeNull();
    });

    it('borne la fin de validité à la fin de la journée choisie', () => {
      // « Jusqu'au 31 août » doit couvrir le 31, pas s'arrêter la veille au
      // soir — le défaut ne se verrait que le jour dit.
      component.code.set('BIENVENUE');
      component.value.set('500');
      component.endsAt.set('2026-08-31');

      component.save();

      const [dto] = service.createDiscountCode.calls.mostRecent().args;
      expect(dto.endsAt).toBe('2026-08-31T23:59:59.999Z');
    });

    it('affiche le refus du serveur sans fermer le dialogue', () => {
      service.createDiscountCode.and.returnValue(
        throwError(() => ({ error: { message: 'Le code « BIENVENUE » existe déjà' } })),
      );
      component.code.set('BIENVENUE');
      component.value.set('500');

      component.save();

      expect(component.error()).toContain('existe déjà');
      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('code déjà utilisé', () => {
    beforeEach(() => build({ ...CODE, usedCount: 3 }));

    it('verrouille le libellé', () => {
      expect(component.codeLocked()).toBeTrue();
    });

    it('laisse modifier les conditions', () => {
      component.value.set('800');

      component.save();

      expect(service.updateDiscountCode).toHaveBeenCalled();
    });

    it('ne transmet pas le code, pour ne pas faire échouer une modification de conditions', () => {
      component.value.set('800');

      component.save();

      const [, dto] = service.updateDiscountCode.calls.mostRecent().args;
      expect(dto.code).toBeUndefined();
    });
  });
});
