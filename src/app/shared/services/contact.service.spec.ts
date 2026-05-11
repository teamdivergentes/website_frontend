import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ContactService } from './contact.service';
import type { ContactRequest, ContactResponse } from './contact.service';

const API_URL = 'http://localhost:3000/api/contact';

const MOCK_REQUEST: ContactRequest = {
  subject: 'Partenariat',
  name: 'Jean Dupont',
  email: 'jean@example.com',
  message: 'Bonjour, nous souhaitons vous proposer un partenariat.',
};

describe('ContactService', () => {
  let service: ContactService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ContactService,
      ],
    });
    service = TestBed.inject(ContactService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  // ------------------------------------------------------------------ //
  // sendContact() — happy path
  // ------------------------------------------------------------------ //

  it('sendContact() doit appeler POST /api/contact avec les donnees du formulaire', () => {
    service.sendContact(MOCK_REQUEST).subscribe();

    const req = http.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(MOCK_REQUEST);
    req.flush({ success: true, message: 'Message envoye avec succes.' });
  });

  it('sendContact() doit retourner la reponse de l\'API', () => {
    const mockResponse: ContactResponse = {
      success: true,
      message: 'Votre message a ete envoye.',
    };
    let result: ContactResponse | undefined;

    service.sendContact(MOCK_REQUEST).subscribe(r => (result = r));

    const req = http.expectOne(API_URL);
    req.flush(mockResponse);

    expect(result).toEqual(mockResponse);
    expect(result?.success).toBeTrue();
  });

  it('sendContact() ne modifie pas les donnees envoyees', () => {
    const dto: ContactRequest = {
      subject: 'Support',
      name: 'Marie Martin',
      email: 'marie@test.fr',
      message: 'Probleme de connexion.',
    };

    service.sendContact(dto).subscribe();

    const req = http.expectOne(API_URL);
    expect(req.request.body).toEqual(dto);
    req.flush({ success: true, message: 'OK' });
  });

  // ------------------------------------------------------------------ //
  // sendContact() — erreur HTTP propagee
  // ------------------------------------------------------------------ //

  it('sendContact() doit propager une erreur 500', () => {
    let errorReceived = false;

    service.sendContact(MOCK_REQUEST).subscribe({
      error: () => (errorReceived = true),
    });

    const req = http.expectOne(API_URL);
    req.flush('Erreur interne', { status: 500, statusText: 'Internal Server Error' });

    expect(errorReceived).toBeTrue();
  });

  it('sendContact() doit propager une erreur 400 (validation)', () => {
    let errorReceived = false;

    service.sendContact(MOCK_REQUEST).subscribe({
      error: () => (errorReceived = true),
    });

    const req = http.expectOne(API_URL);
    req.flush({ message: ['email must be an email'] }, { status: 400, statusText: 'Bad Request' });

    expect(errorReceived).toBeTrue();
  });

  it('sendContact() ne capture pas silencieusement les erreurs', () => {
    let nextCalled = false;
    let errorCalled = false;

    service.sendContact(MOCK_REQUEST).subscribe({
      next: () => (nextCalled = true),
      error: () => (errorCalled = true),
    });

    const req = http.expectOne(API_URL);
    req.flush('Service indisponible', { status: 503, statusText: 'Service Unavailable' });

    expect(nextCalled).toBeFalse();
    expect(errorCalled).toBeTrue();
  });
});
