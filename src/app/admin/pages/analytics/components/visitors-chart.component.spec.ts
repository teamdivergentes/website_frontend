import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { VisitorsChartComponent } from './visitors-chart.component';
import { VisitorsResponse } from '../../../../shared/models';

const MOCK_VISITORS: VisitorsResponse = {
  period: { startDate: '2026-02-21', endDate: '2026-02-27' },
  data: [
    { date: '2026-02-21', totalUsers: 100, newUsers: 40, sessions: 120, pageViews: 300 },
    { date: '2026-02-22', totalUsers: 150, newUsers: 60, sessions: 180, pageViews: 450 },
    { date: '2026-02-23', totalUsers: 80,  newUsers: 30, sessions: 95,  pageViews: 200 }
  ]
};

describe('VisitorsChartComponent', () => {
  let component: VisitorsChartComponent;
  let fixture: ComponentFixture<VisitorsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VisitorsChartComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(VisitorsChartComponent);
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

  it('doit générer chartData avec les bonnes données', () => {
    fixture.componentRef.setInput('data', MOCK_VISITORS);
    fixture.detectChanges();

    const cd = component.chartData();
    expect(cd.labels).toHaveSize(3);
    expect(cd.datasets).toHaveSize(2);
    expect(cd.datasets[0].data).toEqual([100, 150, 80]);
    expect(cd.datasets[1].data).toEqual([40, 60, 30]);
  });

  it('doit retourner des labels et datasets vides quand data est null', () => {
    const cd = component.chartData();
    expect(cd.labels).toHaveSize(0);
    expect(cd.datasets).toHaveSize(0);
  });

  it('doit générer chartAriaLabel quand data est null', () => {
    fixture.detectChanges();
    expect(component.chartAriaLabel()).toBe('Graphique évolution des visiteurs : aucune donnée');
  });

  it('doit générer un chartAriaLabel avec le résumé des données', () => {
    fixture.componentRef.setInput('data', MOCK_VISITORS);
    fixture.detectChanges();

    const label = component.chartAriaLabel();
    // totalSum = 100+150+80 = 330, newSum = 40+60+30 = 130
    expect(label).toContain('330 utilisateurs');
    expect(label).toContain('130 nouveaux');
    expect(label).toContain('3 jours');
  });

  it('doit utiliser la couleur verte DVG pour la série Total', () => {
    fixture.componentRef.setInput('data', MOCK_VISITORS);
    fixture.detectChanges();

    const cd = component.chartData();
    expect((cd.datasets[0] as any)['borderColor']).toBe('#32D299');
  });
});
