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

  // FIX BETA-025 : tests des inputs par défaut et formattedValue
  describe('valeurs par défaut des inputs optionnels', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('title', 'Test KPI');
      fixture.componentRef.setInput('value', 0);
      fixture.detectChanges();
    });

    it('change() retourne null par défaut', () => {
      expect(component.change()).toBeNull();
    });

    it('icon() retourne "bar_chart" par défaut', () => {
      expect(component.icon()).toBe('bar_chart');
    });

    it('format() retourne "number" par défaut', () => {
      expect(component.format()).toBe('number');
    });

    it('noData() retourne false par défaut', () => {
      expect(component.noData()).toBeFalse();
    });
  });

  // ─── US 2 : état noData ───────────────────────────────────────────────────────

  describe('US2 — état noData', () => {
    it('doit afficher "--" quand noData est true', () => {
      fixture.componentRef.setInput('title', 'Utilisateurs');
      fixture.componentRef.setInput('value', 0);
      fixture.componentRef.setInput('noData', true);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.kpi-value')?.textContent?.trim()).toBe('--');
    });

    it('ne doit pas afficher la variation quand noData est true', () => {
      fixture.componentRef.setInput('title', 'Utilisateurs');
      fixture.componentRef.setInput('value', 0);
      fixture.componentRef.setInput('change', 5.5);
      fixture.componentRef.setInput('noData', true);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.kpi-change')).toBeNull();
    });

    it('doit afficher un tooltip "Donnée non disponible" quand noData est true', () => {
      fixture.componentRef.setInput('title', 'Utilisateurs');
      fixture.componentRef.setInput('value', 0);
      fixture.componentRef.setInput('noData', true);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const valueEl = el.querySelector('.kpi-value');
      expect(valueEl?.getAttribute('title')).toContain('non disponible');
    });

    it('doit ajouter la classe css "no-data" à .kpi-card quand noData est true', () => {
      fixture.componentRef.setInput('title', 'Utilisateurs');
      fixture.componentRef.setInput('value', 0);
      fixture.componentRef.setInput('noData', true);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      expect(el.querySelector('.kpi-card.no-data')).toBeTruthy();
    });

    it('doit afficher la valeur formatée normalement quand noData est false', () => {
      fixture.componentRef.setInput('title', 'Utilisateurs');
      fixture.componentRef.setInput('value', 1000);
      fixture.componentRef.setInput('noData', false);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      // formatNumber(1000) = "1.0k" (toFixed(1))
      expect(el.querySelector('.kpi-value')?.textContent?.trim()).toBe('1.0k');
    });
  });

  describe('formattedValue()', () => {
    it('formate correctement un nombre (1500 → "1.5k")', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('value', 1500);
      fixture.componentRef.setInput('format', 'number');
      fixture.detectChanges();
      expect(component.formattedValue()).toBe('1.5k');
    });

    it('formate correctement une durée (format="duration", value=142 → "2m 22s")', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('value', 142);
      fixture.componentRef.setInput('format', 'duration');
      fixture.detectChanges();
      expect(component.formattedValue()).toBe('2m 22s');
    });

    it('formate correctement un pourcentage (format="percent", value=45.3 → "45.3%")', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('value', 45.3);
      fixture.componentRef.setInput('format', 'percent');
      fixture.detectChanges();
      expect(component.formattedValue()).toBe('45.3%');
    });
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

  describe('invertChange', () => {
    it('invertChange à false par défaut', () => {
      fixture.componentRef.setInput('title', 'Test');
      fixture.componentRef.setInput('value', 0);
      fixture.detectChanges();
      expect(component.invertChange()).toBeFalse();
    });

    it('avec invertChange=true, une variation positive est affichée en rouge (négatif)', () => {
      fixture.componentRef.setInput('title', 'Taux de rebond');
      fixture.componentRef.setInput('value', 50);
      fixture.componentRef.setInput('change', 5);
      fixture.componentRef.setInput('invertChange', true);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const changeEl = el.querySelector('.kpi-change');
      expect(changeEl?.classList.contains('negative')).toBeTrue();
      expect(changeEl?.classList.contains('positive')).toBeFalse();
    });

    it('avec invertChange=true, une variation négative est affichée en vert (positif)', () => {
      fixture.componentRef.setInput('title', 'Taux de rebond');
      fixture.componentRef.setInput('value', 50);
      fixture.componentRef.setInput('change', -3);
      fixture.componentRef.setInput('invertChange', true);
      fixture.detectChanges();

      const el: HTMLElement = fixture.nativeElement;
      const changeEl = el.querySelector('.kpi-change');
      expect(changeEl?.classList.contains('positive')).toBeTrue();
      expect(changeEl?.classList.contains('negative')).toBeFalse();
    });
  });
});
