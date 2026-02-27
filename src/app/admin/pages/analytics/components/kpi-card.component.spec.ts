import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
  let fixture: ComponentFixture<KpiCardComponent>;
  let component: KpiCardComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCardComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(KpiCardComponent);
    component = fixture.componentInstance;
  });

  it('devrait être créé', () => {
    fixture.componentRef.setInput('title', 'Utilisateurs');
    fixture.componentRef.setInput('value', 0);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('doit afficher le titre et la valeur', () => {
    fixture.componentRef.setInput('title', 'Total utilisateurs');
    fixture.componentRef.setInput('value', 1500);
    fixture.componentRef.setInput('format', 'number');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.kpi-title')?.textContent).toContain('Total utilisateurs');
    expect(el.querySelector('.kpi-value')?.textContent).toContain('1.5k');
  });

  it('doit formater les grandes valeurs en k', () => {
    fixture.componentRef.setInput('title', 'Sessions');
    fixture.componentRef.setInput('value', 12500);
    fixture.componentRef.setInput('format', 'number');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.kpi-value')?.textContent).toContain('12.5k');
  });

  it('doit formater les valeurs en millions', () => {
    fixture.componentRef.setInput('title', 'Pages vues');
    fixture.componentRef.setInput('value', 2_500_000);
    fixture.componentRef.setInput('format', 'number');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.kpi-value')?.textContent).toContain('2.5M');
  });

  it('doit formater la durée en mm:ss', () => {
    fixture.componentRef.setInput('title', 'Durée moy.');
    fixture.componentRef.setInput('value', 142);
    fixture.componentRef.setInput('format', 'duration');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.kpi-value')?.textContent).toContain('2m 22s');
  });

  it('doit formater le pourcentage', () => {
    fixture.componentRef.setInput('title', 'Taux rebond');
    fixture.componentRef.setInput('value', 45.3);
    fixture.componentRef.setInput('format', 'percent');
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.kpi-value')?.textContent).toContain('45.3%');
  });

  it('doit afficher la variation positive en vert', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('value', 100);
    fixture.componentRef.setInput('change', 15.5);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const changeEl = el.querySelector('.kpi-change');
    expect(changeEl?.classList.contains('positive')).toBeTrue();
    expect(changeEl?.classList.contains('negative')).toBeFalse();
    expect(changeEl?.textContent).toContain('+');
  });

  it('doit afficher la variation négative en rouge', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('value', 100);
    fixture.componentRef.setInput('change', -8.2);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    const changeEl = el.querySelector('.kpi-change');
    expect(changeEl?.classList.contains('negative')).toBeTrue();
    expect(changeEl?.classList.contains('positive')).toBeFalse();
  });

  it('ne doit pas afficher la variation si change est null', () => {
    fixture.componentRef.setInput('title', 'Test');
    fixture.componentRef.setInput('value', 100);
    fixture.componentRef.setInput('change', null);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.kpi-change')).toBeNull();
  });
});
