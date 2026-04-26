import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { GeoTableComponent } from './geo-table.component';
import { GeoResponse } from '../../../../shared/models';

// FIX ALPHA-001 : mock aligné sur la structure backend (byCountry, totalUsers, countryId)
const mockGeoData: GeoResponse = {
  period: { startDate: '2026-02-01', endDate: '2026-02-28' },
  byCountry: [
    { country: 'France',   countryId: 'FR', totalUsers: 800, sessions: 1200 },
    { country: 'Belgique', countryId: 'BE', totalUsers: 200, sessions: 300 },
    { country: 'Suisse',   countryId: 'CH', totalUsers: 100, sessions: 150 }
  ],
  byCity: []
};

describe('GeoTableComponent', () => {
  let fixture: ComponentFixture<GeoTableComponent>;
  let component: GeoTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeoTableComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(GeoTableComponent);
    component = fixture.componentInstance;
  });

  it('devrait être créé', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('doit retourner un tableau vide si data est null (BETA-029)', () => {
    fixture.componentRef.setInput('data', null);
    fixture.detectChanges();

    expect(component.topCountries()).toEqual([]);
  });

  it('doit retourner 0 si maxUsers est 0 — protection division par zéro (BETA-029)', () => {
    const zeroData: GeoResponse = {
      period: { startDate: '2026-02-01', endDate: '2026-02-28' },
      byCountry: [{ country: 'France', countryId: 'FR', totalUsers: 0, sessions: 0 }],
      byCity: []
    };
    fixture.componentRef.setInput('data', zeroData);
    fixture.detectChanges();

    const percent = component.getPercent({ country: 'France', countryId: 'FR', totalUsers: 0, sessions: 0 });
    expect(percent).toBe(0);
  });

  it('doit afficher un message vide si aucune donnée', () => {
    fixture.componentRef.setInput('data', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.geo-empty')).toBeTruthy();
  });

  it('doit afficher les pays triés par nombre d\'utilisateurs décroissant', () => {
    fixture.componentRef.setInput('data', mockGeoData);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('.country-item');
    expect(items.length).toBe(3);

    const firstItem = items[0].textContent as string;
    expect(firstItem).toContain('France');
  });

  it('doit calculer le pourcentage correct par rapport au pays le plus représenté', () => {
    fixture.componentRef.setInput('data', mockGeoData);
    fixture.detectChanges();

    // France est à 100%, Belgique à 25% (200/800) — FIX ALPHA-001 : totalUsers
    const percent = component.getPercent({ country: 'Belgique', countryId: 'BE', totalUsers: 200, sessions: 300 });
    expect(percent).toBe(25);
  });

  it('doit retourner 100% pour le pays avec le max d\'utilisateurs', () => {
    fixture.componentRef.setInput('data', mockGeoData);
    fixture.detectChanges();

    const percent = component.getPercent({ country: 'France', countryId: 'FR', totalUsers: 800, sessions: 1200 });
    expect(percent).toBe(100);
  });

  it('doit limiter l\'affichage à 10 pays maximum', () => {
    const manyCountries: GeoResponse = {
      period: { startDate: '2026-02-01', endDate: '2026-02-28' },
      byCountry: Array.from({ length: 15 }, (_, i) => ({
        country: `Pays ${i}`,
        countryId: `P${i}`,
        totalUsers: 100 - i,
        sessions: 150 - i
      })),
      byCity: []
    };

    fixture.componentRef.setInput('data', manyCountries);
    fixture.detectChanges();

    expect(component.topCountries().length).toBe(10);
  });
});
