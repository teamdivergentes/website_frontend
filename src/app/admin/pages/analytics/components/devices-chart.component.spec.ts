import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { DevicesChartComponent } from './devices-chart.component';
import { DevicesResponse } from '../../../../shared/models';

const MOCK_DEVICES: DevicesResponse = {
  period: { startDate: '2026-02-21', endDate: '2026-02-27' },
  byCategory: [
    { category: 'desktop', totalUsers: 700, sessions: 850, percentage: 70 },
    { category: 'mobile',  totalUsers: 250, sessions: 300, percentage: 25 },
    { category: 'tablet',  totalUsers: 50,  sessions: 60,  percentage: 5  }
  ],
  byBrowser: []
};

const MOCK_DEVICES_EMPTY: DevicesResponse = {
  period: { startDate: '2026-02-21', endDate: '2026-02-27' },
  byCategory: [],
  byBrowser: []
};

describe('DevicesChartComponent', () => {
  let component: DevicesChartComponent;
  let fixture: ComponentFixture<DevicesChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevicesChartComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(DevicesChartComponent);
    component = fixture.componentInstance;
  });

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  it('doit afficher "Aucune donnée" quand data est null', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Aucune donnée disponible');
  });

  it('doit afficher "Aucune donnée" quand byCategory est vide', () => {
    fixture.componentRef.setInput('data', MOCK_DEVICES_EMPTY);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Aucune donnée disponible');
  });

  it('doit traduire les labels d\'appareils en français', () => {
    expect(component.getDeviceLabel('desktop')).toBe('Bureau');
    expect(component.getDeviceLabel('mobile')).toBe('Mobile');
    expect(component.getDeviceLabel('tablet')).toBe('Tablette');
  });

  it('doit retourner la catégorie telle quelle pour un label inconnu', () => {
    expect(component.getDeviceLabel('smarttv')).toBe('smarttv');
  });

  it('doit retourner les couleurs DVG par catégorie', () => {
    expect(component.getDeviceColor('desktop')).toBe('#32D299');
    expect(component.getDeviceColor('mobile')).toBe('#5C6BC0');
    expect(component.getDeviceColor('tablet')).toBe('#FF7043');
  });

  it('doit retourner une couleur par défaut pour une catégorie inconnue', () => {
    expect(component.getDeviceColor('smarttv')).toBe('#888');
  });

  it('doit générer chartData avec les données correctes', () => {
    fixture.componentRef.setInput('data', MOCK_DEVICES);
    fixture.detectChanges();

    const cd = component.chartData();
    expect(cd.labels).toEqual(['Bureau', 'Mobile', 'Tablette']);
    expect(cd.datasets[0].data).toEqual([700, 250, 50]);
  });

  it('doit générer un chartAriaLabel vide quand data est null', () => {
    fixture.detectChanges();
    expect(component.chartAriaLabel()).toBe('Graphique appareils : aucune donnée');
  });

  it('doit générer un chartAriaLabel avec les pourcentages', () => {
    fixture.componentRef.setInput('data', MOCK_DEVICES);
    fixture.detectChanges();

    const label = component.chartAriaLabel();
    expect(label).toContain('Bureau');
    expect(label).toContain('70.0%');
    expect(label).toContain('Mobile');
    expect(label).toContain('25.0%');
  });
});
