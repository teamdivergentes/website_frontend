import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly defaultTitle = 'Team Divergentes | Esport VR EVA';
  private readonly defaultDescription =
    "Team Divergentes, organisation e-sportive crée en 2017. Découvrez nos joueurs, nos équipes et rejoignez l'aventure !";
  private readonly siteUrl = 'https://teamdivergentes.fr';

  /**
   * Met à jour les meta tags de la page
   * @param config Configuration des meta tags
   */
  updateMetaTags(config: {
    title?: string;
    description?: string;
    image?: string;
    imageWidth?: number;
    imageHeight?: number;
    imageAlt?: string;
    url?: string;
    type?: string;
    noIndex?: boolean;
    publishedTime?: string;
    modifiedTime?: string;
  }): void {
    // Format uniforme : "PageTitle | Team Divergentes" pour <title> et og:title
    const pageTitle = config.title
      ? `${config.title} | Team Divergentes`
      : this.defaultTitle;
    const description = config.description || this.defaultDescription;

    // Synchronise <title> et og:title avec le meme format
    this.titleService.setTitle(pageTitle);

    this.meta.updateTag({ name: 'description', content: description });

    // Robots: reset à chaque navigation SPA — une 404 qui setNoIndex ne doit pas
    // contaminer la page suivante.
    const robotsValue = config.noIndex ? 'noindex, nofollow' : 'index, follow';
    this.meta.updateTag({ name: 'robots', content: robotsValue });

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });

    // URL canonique et OG URL
    if (config.url) {
      const fullUrl = config.url.startsWith('http')
        ? config.url
        : `${this.siteUrl}${config.url}`;

      this.meta.updateTag({ property: 'og:url', content: fullUrl });
      this.updateCanonicalLink(fullUrl);
    }

    // Type Open Graph (article, website, etc.)
    this.meta.updateTag({ property: 'og:type', content: config.type ?? 'website' });

    // Images Open Graph et Twitter
    if (config.image) {
      const fullImageUrl = config.image.startsWith('http')
        ? config.image
        : `${this.siteUrl}${config.image}`;

      this.meta.updateTag({ property: 'og:image', content: fullImageUrl });
      this.meta.updateTag({ name: 'twitter:image', content: fullImageUrl });

      // Dimensions recommandées OG pour éviter le re-crawl Facebook/LinkedIn
      const imageWidth = String(config.imageWidth ?? 1200);
      const imageHeight = String(config.imageHeight ?? 630);
      const imageAlt = config.imageAlt ?? pageTitle;
      this.meta.updateTag({ property: 'og:image:width', content: imageWidth });
      this.meta.updateTag({ property: 'og:image:height', content: imageHeight });
      this.meta.updateTag({ property: 'og:image:alt', content: imageAlt });
    }

    // Dates de publication et modification pour og:type article (Open Graph article)
    if (config.publishedTime) {
      this.meta.updateTag({ property: 'og:article:published_time', content: config.publishedTime });
    }
    if (config.modifiedTime) {
      this.meta.updateTag({ property: 'og:article:modified_time', content: config.modifiedTime });
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
   * Supprime tous les scripts JSON-LD du head.
   */
  clearJsonLd(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    document.querySelectorAll('script[type="application/ld+json"]').forEach(el => el.remove());
  }

  /**
   * Ajoute ou met à jour les scripts JSON-LD dans le head.
   * Accepte un objet unique ou un tableau de schemas.
   * @param data Données structured data (objet ou tableau)
   */
  setJsonLd(data: object | object[]): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Supprime tous les scripts JSON-LD existants
    this.clearJsonLd();

    // Normalise en tableau
    const schemas = Array.isArray(data) ? data : [data];
    schemas.forEach(schema => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema).replace(/<\/script>/gi, '<\\/script>');
      document.head.appendChild(script);
    });
  }

  /**
   * Retourne le JSON-LD pour l'organisation avec logo, foundingDate et contactPoint.
   * Utilise les types Organization et SportsOrganization pour mieux cibler la verticale Esports.
   */
  getOrganizationJsonLd(socialUrls: string[] = []): object {
    return {
      '@context': 'https://schema.org',
      '@type': ['Organization', 'SportsOrganization'],
      name: 'Team Divergentes',
      alternateName: 'DVG',
      url: this.siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${this.siteUrl}/assets/logos/logoTD.svg`,
        width: 200,
        height: 200,
      },
      sport: 'Esports',
      foundingDate: '2017',
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'FR',
      },
      description: this.defaultDescription,
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'contact@teamdivergentes.fr',
        contactType: 'customer support',
        availableLanguage: 'French',
      },
      sameAs: socialUrls,
    };
  }

  /**
   * Retourne le JSON-LD WebSite avec SearchAction
   */
  getWebSiteJsonLd(): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Team Divergentes',
      url: this.siteUrl,
      inLanguage: 'fr-FR',
      description: this.defaultDescription,
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
