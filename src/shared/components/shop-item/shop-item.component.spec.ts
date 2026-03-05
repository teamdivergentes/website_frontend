import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentRef, provideZonelessChangeDetection } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ShopItemComponent } from './shop-item.component';

describe('ShopItemComponent', () => {
  let component: ShopItemComponent;
  let fixture: ComponentFixture<ShopItemComponent>;
  let componentRef: ComponentRef<ShopItemComponent>;
  let document: Document;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShopItemComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();

    fixture = TestBed.createComponent(ShopItemComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    document = TestBed.inject(DOCUMENT);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    // Nettoyer le style overflow apres chaque test
    document.body.style.overflow = '';
  });

  // -----------------------------------------------------------------------
  // 1. Creation du composant
  // -----------------------------------------------------------------------
  it('devrait se créer correctement', () => {
    expect(component).toBeTruthy();
  });

  // -----------------------------------------------------------------------
  // 2. Scroll lock quand visible=true
  // -----------------------------------------------------------------------
  it('devrait mettre overflow à "hidden" quand visible=true', async () => {
    componentRef.setInput('visible', true);
    await fixture.whenStable();

    expect(document.body.style.overflow).toBe('hidden');
  });

  // -----------------------------------------------------------------------
  // 3. Restauration du scroll quand visible=false
  // -----------------------------------------------------------------------
  it('devrait restaurer overflow à "" quand visible passe à false', async () => {
    componentRef.setInput('visible', true);
    await fixture.whenStable();
    expect(document.body.style.overflow).toBe('hidden');

    componentRef.setInput('visible', false);
    await fixture.whenStable();

    expect(document.body.style.overflow).toBe('');
  });

  // -----------------------------------------------------------------------
  // 4. close() emet l'evenement closed et reset selectedImage
  // -----------------------------------------------------------------------
  it('devrait émettre l\'événement closed et reset selectedImage lors de close()', async () => {
    componentRef.setInput('visible', true);
    componentRef.setInput('frontImg', 'front.jpg');
    componentRef.setInput('backImg', 'back.jpg');
    await fixture.whenStable();

    // Selectionner une image manuellement
    component.setMain('back.jpg');
    await fixture.whenStable();
    expect(component.currentMainImage()).toBe('back.jpg');

    // Espionner l'evenement closed
    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });

    component.close();
    await fixture.whenStable();

    expect(closedEmitted).toBeTrue();
    // Apres close(), visible est toujours true (le composant ne le modifie pas)
    // Mais selectedImage est reset, donc currentMainImage revient a frontImg
    expect(component.currentMainImage()).toBe('front.jpg');
  });

  // -----------------------------------------------------------------------
  // 5. setMain(image) met a jour currentMainImage
  // -----------------------------------------------------------------------
  it('devrait mettre à jour currentMainImage quand setMain est appelé avec une image valide', async () => {
    componentRef.setInput('visible', true);
    componentRef.setInput('frontImg', 'front.jpg');
    componentRef.setInput('backImg', 'back.jpg');
    await fixture.whenStable();

    component.setMain('back.jpg');
    await fixture.whenStable();

    expect(component.currentMainImage()).toBe('back.jpg');
  });

  // -----------------------------------------------------------------------
  // 6. setMain(null) ne change pas l'image
  // -----------------------------------------------------------------------
  it('ne devrait pas changer l\'image quand setMain est appelé avec null', async () => {
    componentRef.setInput('visible', true);
    componentRef.setInput('frontImg', 'front.jpg');
    await fixture.whenStable();

    const imageBefore = component.currentMainImage();
    component.setMain(null);
    await fixture.whenStable();

    expect(component.currentMainImage()).toBe(imageBefore);
  });

  // -----------------------------------------------------------------------
  // 7. currentMainImage retourne frontImg par defaut quand visible
  // -----------------------------------------------------------------------
  it('devrait retourner frontImg par défaut quand visible=true et aucune image sélectionnée', async () => {
    componentRef.setInput('visible', true);
    componentRef.setInput('frontImg', 'front.jpg');
    componentRef.setInput('backImg', 'back.jpg');
    await fixture.whenStable();

    expect(component.currentMainImage()).toBe('front.jpg');
  });

  it('devrait retourner backImg si frontImg est null et visible=true', async () => {
    componentRef.setInput('visible', true);
    componentRef.setInput('frontImg', null);
    componentRef.setInput('backImg', 'back.jpg');
    await fixture.whenStable();

    expect(component.currentMainImage()).toBe('back.jpg');
  });

  // -----------------------------------------------------------------------
  // 8. currentMainImage retourne null quand pas visible
  // -----------------------------------------------------------------------
  it('devrait retourner null quand visible=false', async () => {
    componentRef.setInput('visible', false);
    componentRef.setInput('frontImg', 'front.jpg');
    await fixture.whenStable();

    expect(component.currentMainImage()).toBeNull();
  });

  // -----------------------------------------------------------------------
  // 9. Escape appelle close() quand visible
  // -----------------------------------------------------------------------
  it('devrait appeler close() quand la touche Escape est pressée et visible=true', async () => {
    componentRef.setInput('visible', true);
    await fixture.whenStable();

    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });

    // Simuler la touche Escape en appelant directement le handler
    component.onEscapeKey();
    await fixture.whenStable();

    expect(closedEmitted).toBeTrue();
  });

  // -----------------------------------------------------------------------
  // 10. Escape ne fait rien quand pas visible
  // -----------------------------------------------------------------------
  it('ne devrait pas émettre closed quand Escape est pressé et visible=false', async () => {
    componentRef.setInput('visible', false);
    await fixture.whenStable();

    let closedEmitted = false;
    component.closed.subscribe(() => {
      closedEmitted = true;
    });

    component.onEscapeKey();
    await fixture.whenStable();

    expect(closedEmitted).toBeFalse();
  });

  // -----------------------------------------------------------------------
  // 11. ngOnDestroy restaure le scroll
  // -----------------------------------------------------------------------
  it('devrait restaurer overflow à "" lors de la destruction du composant', async () => {
    componentRef.setInput('visible', true);
    await fixture.whenStable();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.destroy();

    expect(document.body.style.overflow).toBe('');
  });

  // -----------------------------------------------------------------------
  // 12. Bouton fermer avec le bon aria-label
  // -----------------------------------------------------------------------
  it('devrait avoir un bouton fermer avec aria-label="Fermer"', () => {
    const closeButton = fixture.nativeElement.querySelector('button.closeModal');
    expect(closeButton).toBeTruthy();
    expect(closeButton.getAttribute('aria-label')).toBe('Fermer');
  });

  // -----------------------------------------------------------------------
  // 13. Vignettes avec role="button" et tabindex="0"
  // -----------------------------------------------------------------------
  it('devrait avoir des vignettes avec role="button" et tabindex="0"', () => {
    const thumbnails = fixture.nativeElement.querySelectorAll('.imgItemSuggestion');
    expect(thumbnails.length).toBe(2);

    thumbnails.forEach((thumbnail: HTMLElement) => {
      expect(thumbnail.getAttribute('role')).toBe('button');
      expect(thumbnail.getAttribute('tabindex')).toBe('0');
    });
  });

  // -----------------------------------------------------------------------
  // Tests complementaires
  // -----------------------------------------------------------------------

  it('devrait reinitialiser selectedImage quand visible passe à true (nouvelle ouverture)', async () => {
    componentRef.setInput('visible', true);
    componentRef.setInput('frontImg', 'front.jpg');
    componentRef.setInput('backImg', 'back.jpg');
    await fixture.whenStable();

    // Selectionner l'image arriere
    component.setMain('back.jpg');
    await fixture.whenStable();
    expect(component.currentMainImage()).toBe('back.jpg');

    // Fermer puis rouvrir
    componentRef.setInput('visible', false);
    await fixture.whenStable();
    componentRef.setInput('visible', true);
    await fixture.whenStable();

    // La selection doit etre remise a zero, retour a frontImg
    expect(component.currentMainImage()).toBe('front.jpg');
  });

  it('devrait retourner null si frontImg et backImg sont null quand visible=true', async () => {
    componentRef.setInput('visible', true);
    componentRef.setInput('frontImg', null);
    componentRef.setInput('backImg', null);
    await fixture.whenStable();

    expect(component.currentMainImage()).toBeNull();
  });
});
