import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { MerciComponent } from './merci.component';
import { SeoService } from '../../../shared/services/seo.service';

describe('MerciComponent', () => {
  let component: MerciComponent;
  let fixture: ComponentFixture<MerciComponent>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;

  beforeEach(async () => {
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);

    await TestBed.configureTestingModule({
      imports: [MerciComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: SeoService, useValue: seoServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MerciComponent);
    component = fixture.componentInstance;
  });

  it('devrait se créer', () => {
    expect(component).toBeTruthy();
  });

  it('devrait mettre à jour les meta tags au démarrage', () => {
    fixture.detectChanges();
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Merci pour votre commande', url: '/boutique/merci' }),
    );
  });

  it('devrait afficher un lien de retour vers la boutique', () => {
    fixture.detectChanges();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[routerLink]');
    expect(link).toBeTruthy();
  });
});
