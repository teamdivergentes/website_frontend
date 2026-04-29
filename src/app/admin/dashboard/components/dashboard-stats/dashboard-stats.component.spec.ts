import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideZonelessChangeDetection } from '@angular/core';

import { DashboardStatsComponent } from './dashboard-stats.component';

describe('DashboardStatsComponent', () => {
  let component: DashboardStatsComponent;
  let fixture: ComponentFixture<DashboardStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardStatsComponent, NoopAnimationsModule],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardStatsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('userName', 'admin');
    fixture.componentRef.setInput('userRole', 'Super Admin');
  });

  // ─── Création ──────────────────────────────────────────────────────────────

  it('doit créer le composant', () => {
    expect(component).toBeTruthy();
  });

  // ─── Inputs ────────────────────────────────────────────────────────────────

  it('doit afficher le userName passé en input', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('admin');
  });

  it('doit afficher le userRole passé en input', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Super Admin');
  });

  it('doit afficher le bon nom si userName change', () => {
    fixture.componentRef.setInput('userName', 'maxime');
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('maxime');
  });

  // ─── Quick links ───────────────────────────────────────────────────────────

  it('doit afficher le lien vers /admin/teams', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector<HTMLAnchorElement>('[data-testid="dashboard-stat-teams"]');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/admin/teams');
  });

  it('doit afficher le lien vers /admin/sponsors', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector<HTMLAnchorElement>('[data-testid="dashboard-stat-sponsors"]');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/admin/sponsors');
  });

  it('doit afficher le lien vers /admin/staff', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector<HTMLAnchorElement>('[data-testid="dashboard-stat-staff"]');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/admin/staff');
  });

  it('doit afficher le lien vers /admin/recruitment', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector<HTMLAnchorElement>('[data-testid="dashboard-stat-recruitment"]');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/admin/recruitment');
  });

  it('doit afficher le lien vers /admin/config', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const link = el.querySelector<HTMLAnchorElement>('[data-testid="dashboard-stat-config"]');
    expect(link).not.toBeNull();
    expect(link!.getAttribute('href')).toBe('/admin/config');
  });

  it('doit afficher exactement 5 quick-links', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const links = el.querySelectorAll('.quick-link');
    expect(links.length).toBe(5);
  });

  // ─── Labels ────────────────────────────────────────────────────────────────

  it('doit afficher le label "Équipes"', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Équipes');
  });

  it('doit afficher le label "Recrutement"', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Recrutement');
  });

  it('doit afficher le label "Config"', () => {
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Config');
  });
});
