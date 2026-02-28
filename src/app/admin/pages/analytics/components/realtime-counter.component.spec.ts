import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { RealtimeCounterComponent } from './realtime-counter.component';
import { AnalyticsAdminService } from '../../../../shared/services';
import { RealtimeResponse } from '../../../../shared/models';

const mockRealtime: RealtimeResponse = {
  activeUsers: 7,
  byPage: [
    { page: '/', activeUsers: 4 },
    { page: '/structure', activeUsers: 3 }
  ],
  byCountry: [{ country: 'France', activeUsers: 7 }],
  byDevice: [{ device: 'desktop', activeUsers: 5 }],
  updatedAt: new Date().toISOString()
};

describe('RealtimeCounterComponent', () => {
  let fixture: ComponentFixture<RealtimeCounterComponent>;
  let component: RealtimeCounterComponent;
  let analyticsServiceSpy: jasmine.SpyObj<AnalyticsAdminService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj<AnalyticsAdminService>('AnalyticsAdminService', ['getRealtime']);
    spy.getRealtime.and.returnValue(of(mockRealtime));

    await TestBed.configureTestingModule({
      imports: [RealtimeCounterComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: AnalyticsAdminService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RealtimeCounterComponent);
    component = fixture.componentInstance;
    analyticsServiceSpy = TestBed.inject(AnalyticsAdminService) as jasmine.SpyObj<AnalyticsAdminService>;
  });

  it('devrait être créé', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('doit afficher l\'état loading au démarrage avant la première réponse', () => {
    // On retarde la réponse pour capturer l'état loading initial
    analyticsServiceSpy.getRealtime.and.returnValue(of(mockRealtime).pipe(delay(100)));
    fixture.detectChanges();

    expect(component.loading()).toBeTrue();
    expect(component.data()).toBeNull();
  });

  it('doit charger les données et afficher le compteur', () => {
    fixture.detectChanges();
    fixture.detectChanges(); // déclencher le cycle de détection post-subscribe

    expect(component.loading()).toBeFalse();
    expect(component.error()).toBeFalse();
    expect(component.data()).toBeTruthy();
    expect(component.data()!.activeUsers).toBe(7);
  });

  it('doit afficher les pages actives (byPage)', () => {
    fixture.detectChanges();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const pageItems = el.querySelectorAll('.page-item');
    expect(pageItems.length).toBe(2);
    expect(pageItems[0].textContent).toContain('/');
  });

  it('doit passer en état error si l\'API échoue (FIX ALPHA-002)', () => {
    analyticsServiceSpy.getRealtime.and.returnValue(throwError(() => new Error('Network error')));
    fixture.detectChanges();
    fixture.detectChanges();

    expect(component.error()).toBeTrue();
    expect(component.loading()).toBeFalse();
    expect(component.data()).toBeNull();
  });

  it('doit afficher le message d\'erreur dans le template si error() est true', () => {
    analyticsServiceSpy.getRealtime.and.returnValue(throwError(() => new Error('Network error')));
    fixture.detectChanges();
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.error-state')).toBeTruthy();
    expect(el.querySelector('.error-state')!.textContent).toContain('Données indisponibles');
  });

  it('doit récupérer les données sur le tick suivant après une erreur (résilience polling, FIX ALPHA-002)', fakeAsync(() => {
    let callCount = 0;
    analyticsServiceSpy.getRealtime.and.callFake(() => {
      callCount++;
      if (callCount === 1) {
        return throwError(() => new Error('fail'));
      }
      return of(mockRealtime);
    });

    fixture.detectChanges();
    fixture.detectChanges();

    // Après la première erreur, l'état error est true
    expect(component.error()).toBeTrue();

    // Après 30 secondes, le polling relance un appel
    tick(30_000);
    fixture.detectChanges();

    expect(component.data()!.activeUsers).toBe(7);
    expect(component.error()).toBeFalse();
  }));
});
