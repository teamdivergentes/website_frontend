import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { OrdersCountersComponent } from './orders-counters.component';
import { OrdersService } from '../../shared/services/orders.service';

describe('OrdersCountersComponent', () => {
  let ordersService: jasmine.SpyObj<OrdersService>;

  function setup(): ReturnType<typeof TestBed.createComponent<OrdersCountersComponent>> {
    const fixture = TestBed.createComponent(OrdersCountersComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    ordersService = jasmine.createSpyObj<OrdersService>('OrdersService', ['loadCounters']);

    TestBed.configureTestingModule({
      imports: [OrdersCountersComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: OrdersService, useValue: ordersService },
      ],
    });
  });

  it('affiche les deux compteurs renvoyés par l’API', () => {
    ordersService.loadCounters.and.returnValue(of({ total: 24, lastThirtyDays: 7, windowDays: 30 }));

    const fixture = setup();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('24');
    expect(text).toContain('7');
    expect(text).toContain('Commandes au total');
  });

  /**
   * Masquer le bloc a zero le rendrait indistinguable d'une panne, et c'est au
   * lancement de la boutique qu'on regarde ce chiffre.
   */
  it('affiche zéro plutôt que de disparaître sur une boutique sans commande', () => {
    ordersService.loadCounters.and.returnValue(of({ total: 0, lastThirtyDays: 0, windowDays: 30 }));

    const fixture = setup();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="orders-counter-total"]')).not.toBeNull();
    expect(element.textContent).toContain('0');
  });

  /**
   * Sans `commandes:read` l'API repond 403 : le bloc disparait plutot que de
   * barrer un ecran dont le reste fonctionne.
   */
  it('disparaît sans erreur quand l’appel échoue', () => {
    ordersService.loadCounters.and.returnValue(throwError(() => new Error('403')));

    const fixture = setup();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.orders-counters')).toBeNull();
  });

  it('suit la fenêtre renvoyée par l’API plutôt qu’un libellé en dur', () => {
    ordersService.loadCounters.and.returnValue(of({ total: 3, lastThirtyDays: 1, windowDays: 7 }));

    const fixture = setup();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Commandes sur 7 jours');
  });

  it('affiche un squelette tant que la réponse n’est pas arrivée', () => {
    // Un observable qui n'emet jamais : l'etat de chargement reste en place.
    ordersService.loadCounters.and.returnValue(of<never>());

    const fixture = TestBed.createComponent(OrdersCountersComponent);
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.counters-skeleton'),
    ).not.toBeNull();
  });
});
