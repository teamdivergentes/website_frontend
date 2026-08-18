import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ProductDialogComponent } from './product-dialog.component';
import { ShopAdminService } from '../../../shared/services/shop-admin.service';
import { AdminShopProduct, UpsertShopProductDto } from '../../../shared/models/shop-admin.model';

const PRODUCT: AdminShopProduct = {
  id: 1,
  slug: 'maillot-2026-joker',
  name: 'Maillot 2026 — DVG × Joker',
  shortDescription: null,
  description: null,
  priceCents: 4000,
  promoPriceCents: null,
  promoStartsAt: null,
  promoEndsAt: null,
  images: [
    { id: 1, url: 'front.webp', label: 'face', position: 0, isBack: false, isCard: true },
    { id: 2, url: 'back.webp', label: 'dos', position: 1, isBack: true, isCard: false },
  ],
  allowFlocking: true,
  flockingFeeCents: 500,
  flockingTopPct: 32,
  flockingLeftPct: 50,
  teamId: null,
  active: true,
  position: 0,
  sizes: [{ id: 1, label: 'M', position: 0, stock: 5 }],
};

describe('ProductDialogComponent', () => {
  let fixture: ComponentFixture<ProductDialogComponent>;
  let component: ProductDialogComponent;
  let service: jasmine.SpyObj<ShopAdminService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<ProductDialogComponent>>;

  const build = (product: AdminShopProduct | null = PRODUCT) => {
    TestBed.resetTestingModule();
    service = jasmine.createSpyObj('ShopAdminService', ['create', 'update']);
    service.update.and.returnValue(of(PRODUCT));
    service.create.and.returnValue(of(PRODUCT));
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [ProductDialogComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
        // Le composant d'upload injecte UploadService, qui injecte HttpClient.
        provideHttpClient(),
        { provide: ShopAdminService, useValue: service },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { product } },
      ],
    });

    fixture = TestBed.createComponent(ProductDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(() => build());

  /** Les visuels tels qu'ils partiraient au serveur. */
  function savedImages(): UpsertShopProductDto['images'] {
    component.save();
    return service.update.calls.mostRecent().args[1].images;
  }

  it('reprend la galerie du produit à l’ouverture', () => {
    expect(component.images().map((image) => image.label)).toEqual(['face', 'dos']);
    expect(component.images()[0].isCard).toBeTrue();
  });

  describe('ajout', () => {
    it('ajoute autant de visuels que nécessaire', () => {
      component.onImageUploaded('porte.jpg');
      component.onImageUploaded('detail.jpg');

      expect(component.images().map((image) => image.url)).toEqual([
        'front.webp',
        'back.webp',
        'porte.jpg',
        'detail.jpg',
      ]);
    });

    it('propose un libellé plutôt que de laisser le champ vide', () => {
      // Un libellé obligatoire laissé vide bloquerait l'enregistrement sans que
      // la cause soit lisible à l'écran.
      component.onImageUploaded('porte.jpg');

      expect(component.images()[2].label).toBe('vue 3');
    });

    it('ignore un second téléversement de la même adresse', () => {
      component.onImageUploaded('front.webp');

      expect(component.images()).toHaveSize(2);
    });

    it('désigne le premier visuel comme vitrine sur un produit neuf', () => {
      build(null);

      component.onImageUploaded('front.webp');

      expect(component.images()[0].isCard).toBeTrue();
    });
  });

  describe('ordre', () => {
    it('remonte un visuel dans la liste', () => {
      component.moveImage(1, -1);

      expect(component.images().map((image) => image.label)).toEqual(['dos', 'face']);
    });

    it('descend un visuel dans la liste', () => {
      component.moveImage(0, 1);

      expect(component.images().map((image) => image.label)).toEqual(['dos', 'face']);
    });

    it('ne déborde pas des extrémités', () => {
      component.moveImage(0, -1);
      component.moveImage(1, 1);

      expect(component.images().map((image) => image.label)).toEqual(['face', 'dos']);
    });

    it('transmet l’ordre affiché, la position étant déduite côté serveur', () => {
      component.moveImage(1, -1);

      expect(savedImages()?.map((image) => image.url)).toEqual(['back.webp', 'front.webp']);
    });
  });

  describe('vitrine', () => {
    it('est exclusive : désigner une image libère la précédente', () => {
      component.setCard(1);

      expect(component.images().map((image) => image.isCard)).toEqual([false, true]);
    });

    it('ne disparaît pas avec l’image supprimée', () => {
      // La vitrine était sur la face : la retirer laisserait le catalogue sans
      // vignette du tout.
      component.removeImage(0);

      expect(component.images()).toHaveSize(1);
      expect(component.images()[0].isCard).toBeTrue();
    });

    it('ne réattribue rien quand la galerie est vidée', () => {
      component.removeImage(0);
      component.removeImage(0);

      expect(component.images()).toEqual([]);
    });
  });

  describe('libellé et vue de dos', () => {
    it('met à jour le libellé saisi', () => {
      component.updateLabel(1, 'dos, exemple de flocage');

      expect(component.images()[1].label).toBe('dos, exemple de flocage');
    });

    it('permet de retirer la marque de dos d’un visuel déjà floqué', () => {
      component.toggleBack(1, false);

      expect(component.images()[1].isBack).toBeFalse();
    });
  });

  describe('enregistrement', () => {
    it('transmet la galerie complète', () => {
      expect(savedImages()).toEqual([
        { url: 'front.webp', label: 'face', isBack: false, isCard: true },
        { url: 'back.webp', label: 'dos', isBack: true, isCard: false },
      ]);
    });

    it('écarte un visuel dont le libellé a été vidé', () => {
      component.updateLabel(1, '   ');

      expect(savedImages()).toHaveSize(1);
    });
  });

  describe('tailles et stock', () => {
    it('reprend les tailles et le stock du produit à l’ouverture', () => {
      expect(component.sizeRows()).toEqual([{ label: 'M', stock: '5' }]);
    });

    it('propose des tailles par défaut sur un produit neuf', () => {
      build(null);

      expect(component.sizeRows().map((row) => row.label)).toEqual([
        'XXS',
        'XS',
        'S',
        'M',
        'L',
        'XL',
        'XXL',
        '3XL',
        '4XL',
      ]);
      expect(component.sizeRows().every((row) => row.stock === '')).toBeTrue();
    });

    it('convertit un stock vide en illimité (null)', () => {
      expect(component.parsedSizes()).toEqual([{ label: 'M', stock: 5 }]);

      component.updateSizeStock(0, '');
      expect(component.parsedSizes()).toEqual([{ label: 'M', stock: null }]);
    });

    it('ajoute et retire des tailles', () => {
      component.addSizeRow();
      expect(component.sizeRows()).toHaveSize(2);

      component.removeSizeRow(0);
      expect(component.sizeRows()).toHaveSize(1);
    });

    it('refuse un stock négatif ou non numérique', () => {
      component.updateSizeStock(0, '-1');
      expect(component.sizesError()).toBeDefined();
      expect(component.canSave()).toBeFalse();

      component.updateSizeStock(0, 'abc');
      expect(component.sizesError()).toBeDefined();

      component.updateSizeStock(0, '0');
      expect(component.sizesError()).toBeUndefined();
    });

    it('refuse des tailles dupliquées', () => {
      component.addSizeRow();
      component.updateSizeLabel(1, 'M');

      expect(component.sizesError()).toBeDefined();
    });

    it('refuse de tout retirer', () => {
      component.removeSizeRow(0);

      expect(component.sizeRows()).toHaveSize(0);
      expect(component.sizesError()).toBeDefined();
      expect(component.canSave()).toBeFalse();
    });

    it('transmet les tailles avec leur stock à l’enregistrement', () => {
      component.updateSizeStock(0, '12');
      component.save();

      expect(service.update.calls.mostRecent().args[1].sizes).toEqual([
        { label: 'M', stock: 12 },
      ]);
    });
  });
});
