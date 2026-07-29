import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { TeamHonoursComponent } from './team-honours';
import { Trophy } from '../../models/trophy.model';

registerLocaleData(localeFr);

describe('TeamHonoursComponent', () => {
  let fixture: ComponentFixture<TeamHonoursComponent>;

  const trophy = (id: number, placement: number, date: string, competition: string): Trophy => ({
    id,
    competition,
    placement,
    date,
    featured: false,
    teamId: 1,
    teamName: 'DVG LoL Academy',
  });

  const or = trophy(1, 1, '2025-08-15T00:00:00.000Z', 'LFL D2 Summer Split');
  const argent = trophy(2, 2, '2023-04-15T00:00:00.000Z', 'LFL D2 Spring Split');
  const bronze = trophy(3, 3, '2024-10-15T00:00:00.000Z', 'Coupe de France Esport');
  const quatrieme = trophy(4, 4, '2022-06-15T00:00:00.000Z', 'Trackmania Cup Off');
  const cinquieme = trophy(5, 5, '2021-05-15T00:00:00.000Z', 'Grassroots Cup');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamHonoursComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TeamHonoursComponent);
  });

  it('ne rend rien sans trophée', () => {
    fixture.componentRef.setInput('trophies', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.team-honours')).toBeNull();
  });

  it('rend une ligne par trophée', () => {
    fixture.componentRef.setInput('trophies', [or, argent, bronze]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.team-honours__row').length).toBe(3);
  });

  it('trie par date décroissante', () => {
    fixture.componentRef.setInput('trophies', [argent, or, bronze]);
    fixture.detectChanges();
    const lignes = fixture.nativeElement.querySelectorAll('.team-honours__row');
    expect(lignes[0].textContent).toContain('Summer Split');
    expect(lignes[1].textContent).toContain('Coupe de France');
    expect(lignes[2].textContent).toContain('Spring Split');
  });

  it('plafonne à 4 lignes et affiche le lien vers le palmarès complet', () => {
    fixture.componentRef.setInput('trophies', [or, argent, bronze, quatrieme, cinquieme]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.team-honours__row').length).toBe(4);
    expect(fixture.nativeElement.querySelector('.team-honours__more')).not.toBeNull();
  });

  it('masque le lien quand tous les trophées sont affichés', () => {
    fixture.componentRef.setInput('trophies', [or, argent]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.team-honours__more')).toBeNull();
  });

  it('applique la teinte de rang selon le placement', () => {
    fixture.componentRef.setInput('trophies', [or, argent, bronze, quatrieme]);
    fixture.detectChanges();
    const rangs = fixture.nativeElement.querySelectorAll('.team-honours__rank');
    expect(rangs[0].classList).toContain('gold');
    expect(rangs[1].classList).toContain('bronze');
    expect(rangs[2].classList).toContain('silver');
    expect(rangs[3].classList).toContain('neutral');
  });

  it('affiche le nombre total de titres', () => {
    fixture.componentRef.setInput('trophies', [or, argent, bronze, quatrieme, cinquieme]);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('5');
  });

  it('n’utilise aucun emoji de médaille', () => {
    fixture.componentRef.setInput('trophies', [or, argent, bronze]);
    fixture.detectChanges();
    const texte = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(texte).not.toContain('🥇');
    expect(texte).not.toContain('🥈');
    expect(texte).not.toContain('🥉');
    expect(texte).not.toContain('🏆');
  });
});
