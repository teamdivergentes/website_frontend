import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TopPagesTableComponent } from './top-pages-table.component';
import { TopPagesResponse } from '../../../../shared/models';

const mockData: TopPagesResponse = {
  period: { startDate: '2026-02-01', endDate: '2026-02-28' },
  pages: [
    { page: '/accueil', pageViews: 1200, uniquePageViews: 900, avgTimeOnPage: 90, bounceRate: 35 },
    { page: '/structure', pageViews: 800, uniquePageViews: 600, avgTimeOnPage: 120, bounceRate: 50 },
    { page: '/contact', pageViews: 300, uniquePageViews: 280, avgTimeOnPage: 60, bounceRate: 80 }
  ]
};

describe('TopPagesTableComponent', () => {
  let fixture: ComponentFixture<TopPagesTableComponent>;
  let component: TopPagesTableComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopPagesTableComponent],
      providers: [provideZonelessChangeDetection()]
    }).compileComponents();

    fixture = TestBed.createComponent(TopPagesTableComponent);
    component = fixture.componentInstance;
  });

  it('devrait être créé', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('doit afficher un message vide si aucune donnée', () => {
    fixture.componentRef.setInput('data', null);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.table-empty')).toBeTruthy();
  });

  it('doit afficher les lignes du tableau avec les données', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
  });

  it('doit trier par pageViews décroissant par défaut', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    const firstRowText = rows[0].textContent as string;
    expect(firstRowText).toContain('/accueil');
  });

  it('doit inverser le tri en cliquant deux fois sur la même colonne', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();

    // 1er clic : tri par bounceRate décroissant
    component.sortBy('bounceRate');
    fixture.detectChanges();
    expect(component.sortColumn()).toBe('bounceRate');
    expect(component.sortDirection()).toBe('desc');

    // 2ème clic : tri ascendant
    component.sortBy('bounceRate');
    fixture.detectChanges();
    expect(component.sortDirection()).toBe('asc');
  });

  it('doit formater correctement la durée en mm:ss', () => {
    expect(component.formatDuration(90)).toBe('1:30');
    expect(component.formatDuration(65)).toBe('1:05');
    expect(component.formatDuration(0)).toBe('0:00');
  });

  it('doit retourner le bon icon de tri', () => {
    // Colonne active : desc
    component.sortBy('pageViews');
    expect(component.getSortIcon('pageViews')).toBe('expand_more');

    // Colonne active : asc
    component.sortBy('pageViews'); // bascule en asc
    expect(component.getSortIcon('pageViews')).toBe('expand_less');

    // Colonne inactive
    expect(component.getSortIcon('bounceRate')).toBe('unfold_more');
  });
});
