import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TopPagesTableComponent } from './top-pages-table.component';
import { TopPagesResponse } from '../../../../shared/models';
import { formatDuration } from '../utils/format.utils';

// FIX ALPHA-001 : mock aligné sur la structure backend (path, totalUsers, avgSessionDuration)
const mockData: TopPagesResponse = {
  period: { startDate: '2026-02-01', endDate: '2026-02-28' },
  data: [
    { path: '/accueil', title: 'Accueil', pageViews: 1200, totalUsers: 900, avgSessionDuration: 90, bounceRate: 35 },
    { path: '/structure', title: 'Structure', pageViews: 800, totalUsers: 600, avgSessionDuration: 120, bounceRate: 50 },
    { path: '/contact', title: 'Contact', pageViews: 300, totalUsers: 280, avgSessionDuration: 60, bounceRate: 80 }
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

  it('doit afficher les bons chemins de page (path)', () => {
    fixture.componentRef.setInput('data', mockData);
    fixture.detectChanges();

    const paths = fixture.nativeElement.querySelectorAll('.page-path');
    expect(paths[0].textContent.trim()).toContain('/accueil');
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

  // FIX BETA-023 : tests getSortAriaAttr
  describe('getSortAriaAttr', () => {
    it('doit retourner "descending" pour pageViews par défaut (colonne initiale + direction desc)', () => {
      // État initial : sortColumn = 'pageViews', sortDirection = 'desc'
      expect(component.getSortAriaAttr('pageViews')).toBe('descending');
    });

    it('doit retourner "none" pour une colonne non active', () => {
      // totalUsers n'est pas la colonne de tri active au départ
      expect(component.getSortAriaAttr('totalUsers')).toBe('none');
    });

    it('doit retourner "descending" pour totalUsers après un premier sortBy("totalUsers")', () => {
      component.sortBy('totalUsers');
      expect(component.getSortAriaAttr('totalUsers')).toBe('descending');
    });

    it('doit retourner "ascending" pour totalUsers après deux sortBy("totalUsers")', () => {
      component.sortBy('totalUsers'); // passe en desc
      component.sortBy('totalUsers'); // bascule en asc
      expect(component.getSortAriaAttr('totalUsers')).toBe('ascending');
    });
  });

  it('doit formater correctement la durée via formatDuration utilitaire', () => {
    // FIX BETA-005 : formatDuration vient de format.utils
    expect(formatDuration(90)).toBe('1m 30s');
    expect(formatDuration(65)).toBe('1m 05s');
    expect(formatDuration(0)).toBe('0m 00s');
  });
});
