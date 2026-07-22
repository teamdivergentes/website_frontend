import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { BuyDialogComponent } from './buy-dialog.component';
import { ShopService } from '../../shared/services/shop.service';
import { ShopProduct } from '../../shared/models/shop-product.model';

const sizedProduct: ShopProduct = {
  id: 'maillotDvg_2023',
  name: 'MAILLOT 2023',
  priceCents: 3990,
  sizes: ['S', 'M', 'L'],
  descKey: 'detailsMaillot2023',
  images: { front: 'a.png', back: null },
  active: true,
};

const sizelessProduct: ShopProduct = { ...sizedProduct, id: 'tapisSourisDvg', sizes: [] };

describe('BuyDialogComponent', () => {
  let fixture: ComponentFixture<BuyDialogComponent>;
  let component: BuyDialogComponent;
  let shopService: jasmine.SpyObj<ShopService>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<BuyDialogComponent>>;

  async function setup(product: ShopProduct): Promise<void> {
    const serviceSpy = jasmine.createSpyObj('ShopService', ['createCheckout', 'loadProducts']);
    const refSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.resetTestingModule()
      .configureTestingModule({
        imports: [BuyDialogComponent],
        providers: [
          provideZonelessChangeDetection(),
          provideNoopAnimations(),
          { provide: ShopService, useValue: serviceSpy },
          { provide: MatDialogRef, useValue: refSpy },
          { provide: MAT_DIALOG_DATA, useValue: { product } },
        ],
      })
      .compileComponents();

    shopService = TestBed.inject(ShopService) as jasmine.SpyObj<ShopService>;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<BuyDialogComponent>>;
    fixture = TestBed.createComponent(BuyDialogComponent);
    component = fixture.componentInstance;
    // window.location.href provoquerait un rechargement complet de page et
    // deconnecterait le runner Karma : on neutralise la redirection reelle.
    spyOn(component, 'redirectToCheckout');
  }

  it('présélectionne la première taille disponible', async () => {
    await setup(sizedProduct);
    expect(component.form.value.size).toBe('S');
  });

  it("n'envoie pas de taille pour un produit sans déclinaison", async () => {
    await setup(sizelessProduct);
    shopService.createCheckout.and.returnValue(of({ url: 'https://stripe/cs_1' }));

    component.pay();

    expect(shopService.createCheckout).toHaveBeenCalledWith({
      productId: 'tapisSourisDvg',
      quantity: 1,
    });
  });

  it('envoie la taille et la quantité choisies, sans prix', async () => {
    await setup(sizedProduct);
    shopService.createCheckout.and.returnValue(of({ url: 'https://stripe/cs_1' }));
    component.form.patchValue({ size: 'L', quantity: 3 });

    component.pay();

    expect(shopService.createCheckout).toHaveBeenCalledWith({
      productId: 'maillotDvg_2023',
      quantity: 3,
      size: 'L',
    });
    expect(dialogRef.close).toHaveBeenCalledWith(true);
    expect(component.redirectToCheckout).toHaveBeenCalledWith('https://stripe/cs_1');
  });

  it("n'appelle pas le service si la quantité est invalide", async () => {
    await setup(sizedProduct);
    component.form.patchValue({ quantity: 99 });

    component.pay();

    expect(shopService.createCheckout).not.toHaveBeenCalled();
  });

  it('affiche un message et réactive le bouton si le checkout échoue', async () => {
    await setup(sizedProduct);
    shopService.createCheckout.and.returnValue(
      throwError(() => ({ error: { message: 'Produit introuvable ou indisponible' } })),
    );

    component.pay();

    expect(component.error()).toBe('Produit introuvable ou indisponible');
    expect(component.submitting()).toBe(false);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
