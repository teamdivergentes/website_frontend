import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

/**
 * Service de gestion du SEO
 * Gère les meta tags, Open Graph, Twitter Cards et JSON-LD
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly title = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly defaultTitle = 'Team Divergentes | Esport VR EVA';
  private readonly defaultDescription =
    "Team Divergentes, équipe esport en réalité virtuelle sur EVA. Découvrez nos joueurs, nos équipes et rejoignez l'aventure !";
  private readonly siteUrl = 'https://teamdivergentes.fr';

  /**
   * Met à jour les meta tags de la page
   * @param config Configuration des meta tags
   */
  updateMetaTags(config: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
  }): void {
    const pageTitle = config.title
      ? `${config.title} | Team Divergentes`
      : this.defaultTitle;
    const description = config.description || this.defaultDescription;

    // Title et description
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });

    // URL canonique et OG URL
    if (config.url) {
      const fullUrl = config.url.startsWith('http')
        ? config.url
        : `${this.siteUrl}${config.url}`;

      this.meta.updateTag({ property: 'og:url', content: fullUrl });
      this.updateCanonicalLink(fullUrl);
    }

    // Images Open Graph et Twitter
    if (config.image) {
      const fullImageUrl = config.image.startsWith('http')
        ? config.image
        : `${this.siteUrl}${config.image}`;

      this.meta.updateTag({ property: 'og:image', content: fullImageUrl });
      this.meta.updateTag({ name: 'twitter:image', content: fullImageUrl });
    }
  }

  /**
   * Met à jour ou crée le lien canonique
   * @param url URL canonique
   */
  private updateCanonicalLink(url: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    let link: HTMLLinkElement | null = document.querySelector(
      'link[rel="canonical"]'
    );

    if (link) {
      link.setAttribute('href', url);
    } else {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      document.head.appendChild(link);
    }
  }

  /**
   * Ajoute ou met à jour un script JSON-LD dans le head
   * @param data Données structured data
   */
  setJsonLd(data: object): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Supprime l'existant
    const existing = document.querySelector('script[type="application/ld+json"]');
    if (existing) {
      existing.remove();
    }

    // Crée le nouveau script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
  }

  /**
   * Retourne le JSON-LD pour l'organisation
   */
  getOrganizationJsonLd(): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Team Divergentes',
      url: this.siteUrl,
      description: this.defaultDescription,
      sameAs: [],
    };
  }

  /**
   * Retourne le JSON-LD pour une équipe esport
   * @param teamName Nom de l'équipe
   * @param game Nom du jeu
   */
  getSportsTeamJsonLd(teamName: string, game: string): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'SportsTeam',
      name: teamName,
      sport: game,
      memberOf: {
        '@type': 'Organization',
        name: 'Team Divergentes',
      },
    };
  }
}
