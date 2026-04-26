import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TrafficSourcesChartComponent } from './traffic-sources-chart.component';
import { TrafficSourcesResponse } from '../../../../shared/models';

const MOCK_TRAFFIC: TrafficSourcesResponse = {
  period: { startDate: '2026-02-21', endDate: '2026-02-27' },
  data: [],
  byChannel: [
    { channel: 'Organic Search', sessions: 600, totalUsers: 500, bounceRate: 40 },
    { channel: 'Direct',         sessions: 300, totalUsers: 250, bounceRate: 50 },
    { channel: 'Social',         sessions: 100, totalUsers: 80,  bounceRate: 60 }
  ]
};

const MOCK_TRAFFIC_EMPTY: TrafficSourcesResponse = {
  period: { startDate: '2026-02-21', endDate: '2026-02-27' },
  data: [],
  byChannel: []
};

describe('TrafficSourcesChartComponent', () => {
  let component: TrafficSourcesChartComponent;
  let fixture: ComponentFixture<TrafficSourcesChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrafficSourcesChartComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(TrafficSourcesChartComponent);
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

  it('doit afficher "Aucune donnée" quand byChannel est vide', () => {
    fixture.componentRef.setInput('data', MOCK_TRAFFIC_EMPTY);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Aucune donnée disponible');
  });

  it('doit calculer getChannelPercent correctement', () => {
    fixture.componentRef.setInput('data', MOCK_TRAFFIC);
    fixture.detectChanges();

    // total = 600+300+100 = 1000
    expect(component.getChannelPercent(600)).toBeCloseTo(60, 1);
    expect(component.getChannelPercent(300)).toBeCloseTo(30, 1);
    expect(component.getChannelPercent(100)).toBeCloseTo(10, 1);
  });

  it('doit retourner 0 pour getChannelPercent quand data est null', () => {
    fixture.detectChanges();
    expect(component.getChannelPercent(500)).toBe(0);
  });

  it('doit générer un chartAriaLabel vide quand data est null', () => {
    fixture.detectChanges();
    expect(component.chartAriaLabel()).toBe('Graphique sources de trafic : aucune donnée');
  });

  it('doit générer un chartAriaLabel avec les pourcentages', () => {
    fixture.componentRef.setInput('data', MOCK_TRAFFIC);
    fixture.detectChanges();

    const label = component.chartAriaLabel();
    expect(label).toContain('Organic Search');
    expect(label).toContain('60%');
    expect(label).toContain('Direct');
    expect(label).toContain('30%');
  });

  it('doit utiliser les couleurs du tableau CHANNEL_COLORS', () => {
    fixture.componentRef.setInput('data', MOCK_TRAFFIC);
    fixture.detectChanges();

    // La première couleur doit être le vert DVG
    expect(component.getColor(0)).toBe('#32D299');
    // La rotation cyclique doit fonctionner
    expect(component.getColor(8)).toBe(component.getColor(0));
  });

  it('doit générer chartData avec les labels et données correctes', () => {
    fixture.componentRef.setInput('data', MOCK_TRAFFIC);
    fixture.detectChanges();

    const cd = component.chartData();
    expect(cd.labels).toEqual(['Organic Search', 'Direct', 'Social']);
    expect(cd.datasets[0].data).toEqual([600, 300, 100]);
  });
});
