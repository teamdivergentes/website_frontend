import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideZonelessChangeDetection } from '@angular/core';

import { DashboardRecentComponent } from './dashboard-recent.component';

describe('DashboardRecentComponent', () => {
  let component: DashboardRecentComponent;
  let fixture: ComponentFixture<DashboardRecentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardRecentComponent, NoopAnimationsModule],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardRecentComponent);
    component = fixture.componentInstance;
  });

  // ─── Création ──────────────────────────────────────────────────────────────

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  // ─── Horloge ───────────────────────────────────────────────────────────────

  it('doit initialiser currentDateTime avec la date du jour', () => {
    const dateTime = component.currentDateTime();
    expect(dateTime).toContain('•');
    expect(dateTime.length).toBeGreaterThan(10);
  });

  it('doit avoir currentDateTime défini après initialisation', () => {
    fixture.detectChanges();
    expect(component.currentDateTime()).toBeDefined();
    expect(typeof component.currentDateTime()).toBe('string');
    expect(component.currentDateTime().length).toBeGreaterThan(0);
  });

  it('doit contenir une date au format français dans currentDateTime', () => {
    const dateTime = component.currentDateTime();
    // Format attendu : "28 avril 2026 • 10:35" (jour mois année • hh:mm)
    expect(dateTime).toMatch(/\d{2}\s\w+\s\d{4}/);
  });

  it('doit contenir une heure dans currentDateTime', () => {
    const dateTime = component.currentDateTime();
    expect(dateTime).toMatch(/\d{2}:\d{2}/);
  });

  // ─── Template (DOM) ────────────────────────────────────────────────────────

  it('doit afficher la section "État du site"', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.site-status')).not.toBeNull();
  });

  it('doit afficher le point de statut animé', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.status-dot')).not.toBeNull();
  });

  it('doit afficher le texte "En ligne"', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('En ligne');
  });

  it('doit afficher le libellé de version', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('v1.0.0');
  });

  it('doit afficher les 3 colonnes de la grille de statut', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const items = el.querySelectorAll('.status-item');
    expect(items.length).toBe(3);
  });

  it('doit afficher les labels "Date et heure", "Version" et "Statut"', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const labels = Array.from(el.querySelectorAll('.status-label')).map(l => l.textContent?.trim());
    expect(labels).toContain('Date et heure');
    expect(labels).toContain('Version');
    expect(labels).toContain('Statut');
  });

  it('doit afficher la valeur de currentDateTime dans le DOM', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const dateValue = el.querySelector('.status-item:first-child .status-value');
    expect(dateValue).not.toBeNull();
    expect(dateValue!.textContent?.trim().length).toBeGreaterThan(0);
  });
});
