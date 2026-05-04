import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { BrowserModule, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';

import { SafePipe } from './safe.pipe';

describe('SafePipe', () => {
  let pipe: SafePipe;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserModule],
      providers: [provideZonelessChangeDetection(), SafePipe],
    });
    pipe = TestBed.inject(SafePipe);
  });

  // ------------------------------------------------------------------ //
  // type 'html' — sanitize strict
  // ------------------------------------------------------------------ //

  it('transform(value, "html") doit retourner une chaine sanitisee', () => {
    const html = '<p>Bonjour <strong>le monde</strong></p>';
    const result = pipe.transform(html, 'html');
    // Le sanitizer retourne une chaine ou une SafeHtml
    expect(result).toBeTruthy();
    expect(typeof result === 'string' || typeof result === 'object').toBeTrue();
  });

  it('transform(valeur vide, "html") doit retourner une chaine vide', () => {
    const result = pipe.transform('', 'html');
    expect(result).toBe('');
  });

  it('transform(script XSS, "html") doit supprimer la balise script', () => {
    const malicious = '<script>alert("xss")</script>';
    const result = pipe.transform(malicious, 'html');
    // Angular sanitize supprime les scripts, on obtient une chaine vide ou sans script
    expect(result).not.toContain('<script>');
  });

  it('transform(html valide, "html") conserve les balises autorisees', () => {
    const safe = '<p>Texte <em>normal</em></p>';
    const result = pipe.transform(safe, 'html') as string;
    // La valeur doit contenir le contenu texte
    expect(result).toContain('Texte');
  });

  // ------------------------------------------------------------------ //
  // type 'url' — bypass
  // ------------------------------------------------------------------ //

  it('transform(url, "url") doit retourner un objet SafeUrl', () => {
    const url = 'https://teamdivergentes.fr/image.png';
    const result = pipe.transform(url, 'url') as SafeUrl;

    // Verifie que c'est bien un objet SafeUrl (bypass)
    expect(result).toBeTruthy();
    // La comparaison directe avec le trusted peut varier selon les implementations
    // On verifie que le type est correct
    expect(typeof result === 'object').toBeTrue();
  });

  it('transform(url externe, "url") retourne un SafeUrl', () => {
    const url = 'https://youtube.com/@dvg';
    const result = pipe.transform(url, 'url');
    expect(result).toBeTruthy();
    expect(typeof result === 'object').toBeTrue();
  });

  // ------------------------------------------------------------------ //
  // type 'resourceUrl' — bypass pour iframes
  // ------------------------------------------------------------------ //

  it('transform(url youtube, "resourceUrl") doit retourner un SafeResourceUrl', () => {
    const url = 'https://www.youtube.com/embed/abc123';
    const result = pipe.transform(url, 'resourceUrl') as SafeResourceUrl;
    expect(result).toBeTruthy();
    expect(typeof result === 'object').toBeTrue();
  });

  // ------------------------------------------------------------------ //
  // type 'style' — bypass CSS
  // ------------------------------------------------------------------ //

  it('transform(css, "style") doit retourner un objet truthy', () => {
    const css = 'background-color: #32D299; color: white;';
    const result = pipe.transform(css, 'style');
    expect(result).toBeTruthy();
    expect(typeof result === 'object').toBeTrue();
  });

  // ------------------------------------------------------------------ //
  // type invalide — leve une erreur
  // ------------------------------------------------------------------ //

  it('transform(value, "invalid") doit lever une erreur', () => {
    expect(() => pipe.transform('test', 'invalid')).toThrowError(/SafePipe/);
  });

  it('transform(value, "") doit lever une erreur', () => {
    expect(() => pipe.transform('test', '')).toThrowError(/SafePipe/);
  });

  it('transform(value, "script") doit lever une erreur', () => {
    expect(() => pipe.transform('<script>', 'script')).toThrowError(/SafePipe/);
  });
});
