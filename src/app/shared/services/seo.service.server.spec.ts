import { TestBed } from '@angular/core/testing';
import { DOCUMENT, PLATFORM_ID, provideZonelessChangeDetection } from '@angular/core';

import { SeoService } from './seo.service';
import { RuntimeConfigService } from '../../../shared/services/runtime-config.service';

/**
 * EPIC-29 — c'est l'objet meme de l'EPIC : le lien canonique et le JSON-LD
 * doivent figurer dans le HTML **envoye aux crawlers**, donc etre produits au
 * rendu serveur. Une garde `isPlatformBrowser` les aurait supprimes du HTML lu
 * par Discord, LinkedIn ou Bingbot.
 */
describe('SeoService — rendu serveur', () => {
  let service: SeoService;
  let doc: Document;

  beforeEach(() => {
    const runtimeConfigStub = {
      siteUrl: 'https://preprod.teamdivergentes.fr',
    } as RuntimeConfigService;

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        SeoService,
        // PLATFORM_ID 'server' : le service ne doit plus s'en soucier.
        { provide: PLATFORM_ID, useValue: 'server' },
        { provide: RuntimeConfigService, useValue: runtimeConfigStub },
      ],
    });

    service = TestBed.inject(SeoService);
    doc = TestBed.inject(DOCUMENT);
  });

  afterEach(() => {
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
    doc.querySelector('link[rel="canonical"]')?.remove();
  });

  it('emet le lien canonique dans le head', () => {
    service.updateMetaTags({ title: 'Un article', url: '/articles/mon-article' });

    const canonical = doc.querySelector('link[rel="canonical"]');
    expect(canonical).not.toBeNull();
    expect(canonical?.getAttribute('href')).toBe(
      'https://preprod.teamdivergentes.fr/articles/mon-article'
    );
  });

  it('met a jour le canonique existant au lieu d en ajouter un second', () => {
    service.updateMetaTags({ url: '/articles/premier' });
    service.updateMetaTags({ url: '/articles/second' });

    const canonicals = doc.querySelectorAll('link[rel="canonical"]');
    expect(canonicals.length).toBe(1);
    expect(canonicals[0].getAttribute('href')).toBe(
      'https://preprod.teamdivergentes.fr/articles/second'
    );
  });

  it('raccorde les chemins sans slash initial sans coller a l origine', () => {
    // Regression : `assets/img/hero.webp` produisait
    // `https://preprod.teamdivergentes.frassets/img/hero.webp`, une URL invalide
    // que les scrapers rejettent en silence — carte affichee sans image.
    service.updateMetaTags({ url: 'articles/mon-article', image: 'assets/img/hero.webp' });

    const ogImage = doc.querySelector('meta[property="og:image"]');
    const ogUrl = doc.querySelector('meta[property="og:url"]');
    expect(ogImage?.getAttribute('content')).toBe(
      'https://preprod.teamdivergentes.fr/assets/img/hero.webp'
    );
    expect(ogUrl?.getAttribute('content')).toBe(
      'https://preprod.teamdivergentes.fr/articles/mon-article'
    );
  });

  it('laisse intactes les URLs deja absolues', () => {
    service.updateMetaTags({
      url: 'https://teamdivergentes.fr/articles/x',
      image: 'https://cdn.example.com/hero.webp',
    });

    expect(doc.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      'https://cdn.example.com/hero.webp'
    );
    expect(doc.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://teamdivergentes.fr/articles/x'
    );
  });

  it('emet le JSON-LD dans le head', () => {
    service.setJsonLd({ '@context': 'https://schema.org', '@type': 'Article', name: 'Mon article' });

    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(1);
    expect(JSON.parse(scripts[0].textContent ?? '{}')).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Article',
      name: 'Mon article',
    });
  });

  it('remplace les JSON-LD precedents au lieu de les empiler', () => {
    service.setJsonLd([{ '@type': 'Organization' }, { '@type': 'WebSite' }]);
    service.setJsonLd({ '@type': 'Article' });

    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(1);
    expect(JSON.parse(scripts[0].textContent ?? '{}')).toEqual({ '@type': 'Article' });
  });

  it('neutralise une fermeture de script injectee dans les donnees', () => {
    service.setJsonLd({ '@type': 'Article', name: '</script><script>alert(1)</script>' });

    const script = doc.querySelector('script[type="application/ld+json"]');
    expect(script?.textContent).not.toContain('</script>');
    expect(script?.textContent).toContain('<\\/script>');
  });
});
