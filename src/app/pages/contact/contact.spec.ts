import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { ContactComponent } from './contact';
import { ContactService } from '../../shared/services/contact.service';
import { SeoService } from '../../shared/services/seo.service';
import { ConfigService } from '../../shared/services/config.service';
import { signal } from '@angular/core';

describe('ContactComponent', () => {
  let component: ContactComponent;
  let fixture: ComponentFixture<ContactComponent>;
  let contactServiceSpy: jasmine.SpyObj<ContactService>;
  let seoServiceSpy: jasmine.SpyObj<SeoService>;
  let configServiceSpy: jasmine.SpyObj<ConfigService>;

  const mockConfigsSignal = signal([
    { id: 1, key: 'discord_url', value: 'https://discord.gg/test', createdAt: '', updatedAt: '' },
    { id: 2, key: 'contact_email', value: 'test@test.fr', createdAt: '', updatedAt: '' },
  ]);

  beforeEach(async () => {
    contactServiceSpy = jasmine.createSpyObj('ContactService', ['sendContact']);
    seoServiceSpy = jasmine.createSpyObj('SeoService', ['updateMetaTags']);
    configServiceSpy = jasmine.createSpyObj('ConfigService', [], {
      configs: mockConfigsSignal,
    });

    await TestBed.configureTestingModule({
      imports: [ContactComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: ContactService, useValue: contactServiceSpy },
        { provide: SeoService, useValue: seoServiceSpy },
        { provide: ConfigService, useValue: configServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactComponent);
    component = fixture.componentInstance;
  });

  it('devrait se créer', () => {
    expect(component).toBeTruthy();
  });

  it('devrait appeler updateMetaTags au init', () => {
    fixture.detectChanges();
    expect(seoServiceSpy.updateMetaTags).toHaveBeenCalledWith(
      jasmine.objectContaining({ title: 'Contact' })
    );
  });

  it('devrait résoudre discordUrl depuis les configs', () => {
    fixture.detectChanges();
    expect(component.discordUrl()).toBe('https://discord.gg/test');
  });

  it('devrait résoudre contactEmail depuis les configs', () => {
    fixture.detectChanges();
    expect(component.contactEmail()).toBe('test@test.fr');
  });

  it('ne devrait pas soumettre si selectedGame est null', () => {
    component.selectedGame = null;
    component.onSubmit();
    expect(contactServiceSpy.sendContact).not.toHaveBeenCalled();
  });

  it('devrait soumettre le formulaire et afficher le succès', () => {
    contactServiceSpy.sendContact.and.returnValue(
      of({ success: true, message: 'Envoyé' })
    );

    component.selectedGame = 'eSport';
    component.name = 'Test User';
    component.email = 'test@example.com';
    component.request = 'Mon message de test';

    component.onSubmit();

    expect(contactServiceSpy.sendContact).toHaveBeenCalled();
    expect(component.submitSuccess()).toBeTrue();
    expect(component.isSubmitting()).toBeFalse();
  });

  it('devrait afficher une erreur serveur en cas d\'échec', () => {
    contactServiceSpy.sendContact.and.returnValue(
      throwError(() => ({ error: { message: 'Erreur serveur' } }))
    );

    component.selectedGame = 'eSport';
    component.name = 'Test';
    component.email = 'test@test.fr';
    component.request = 'Message';

    component.onSubmit();

    expect(component.submitError()).toBe('Erreur serveur');
    expect(component.isSubmitting()).toBeFalse();
  });

  it('devrait réinitialiser l\'état au resetForm()', () => {
    component.submitSuccess.set(true);
    component.submitError.set('Erreur');

    component.resetForm();

    expect(component.submitSuccess()).toBeFalse();
    expect(component.submitError()).toBeNull();
  });
});
