import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BreadcrumbComponent, BreadcrumbItem } from './breadcrumb.component';

describe('BreadcrumbComponent', () => {
  let fixture: ComponentFixture<BreadcrumbComponent>;

  const chemin: BreadcrumbItem[] = [
    { name: 'Accueil', url: '/' },
    { name: 'Équipes', url: '/structure/equipes' },
    { name: 'DVG Nova', url: '/structure/equipes/dvg-nova' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbComponent);
  });

  const render = (items: BreadcrumbItem[]): HTMLElement => {
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('rend un maillon par element du chemin', () => {
    expect(render(chemin).querySelectorAll('li')).toHaveSize(3);
  });

  it('rend une liste ordonnee dans une balise nav', () => {
    const el = render(chemin);

    expect(el.querySelector('nav ol')).toBeTruthy();
  });

  it('nomme la region pour les lecteurs d’ecran', () => {
    expect(render(chemin).querySelector('nav')?.getAttribute('aria-label')).toBe('Fil d’Ariane');
  });

  // Le dernier maillon est la page courante : on y est deja, il ne doit pas etre
  // cliquable, et c'est lui qui porte la position.
  it('rend le dernier maillon en texte, avec aria-current', () => {
    const el = render(chemin);
    const courant = el.querySelector('[aria-current="page"]');

    expect(courant?.textContent?.trim()).toBe('DVG Nova');
    expect(courant?.tagName).not.toBe('A');
  });

  it('rend tous les maillons precedents en liens', () => {
    const liens = render(chemin).querySelectorAll('a');

    expect(liens).toHaveSize(2);
    expect(liens[0].textContent?.trim()).toBe('Accueil');
    expect(liens[1].textContent?.trim()).toBe('Équipes');
  });

  it('n’affiche aucun separateur apres le dernier maillon', () => {
    const el = render(chemin);

    expect(el.querySelectorAll('.dvg-breadcrumb__separator')).toHaveSize(2);
  });

  it('masque les separateurs aux lecteurs d’ecran', () => {
    const sep = render(chemin).querySelector('.dvg-breadcrumb__separator');

    expect(sep?.getAttribute('aria-hidden')).toBe('true');
  });

  it('gere un chemin a deux niveaux', () => {
    const el = render([
      { name: 'Accueil', url: '/' },
      { name: 'Un article', url: '/articles/un-article' },
    ]);

    expect(el.querySelectorAll('li')).toHaveSize(2);
    expect(el.querySelectorAll('a')).toHaveSize(1);
    expect(el.querySelector('[aria-current="page"]')?.textContent?.trim()).toBe('Un article');
  });
});
