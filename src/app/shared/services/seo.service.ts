import { DOCUMENT, Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RuntimeConfigService } from '../../../shared/services/runtime-config.service';
import { Article } from '../models';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly meta = inject(Meta);
  private readonly titleService = inject(Title);
  private readonly document = inject(DOCUMENT);
  private readonly runtimeConfig = inject(RuntimeConfigService);

  private readonly defaultTitle = 'Team Divergentes | Esport VR EVA';
  private readonly defaultDescription =
    "Team Divergentes, organisation e-sportive crée en 2017. Découvrez nos joueurs, nos équipes et rejoignez l'aventure !";
  /** Banniere de marque, servie quand une page n'a pas d'image propre. */
  private readonly fallbackImage = '/assets/img/banniere-charte-graphique/images4k.jpg';

  private get siteUrl(): string {
    return this.runtimeConfig.siteUrl;
  }

  /**
   * Image OG du site, configurable par l'admin via `OG_IMAGE`, sinon la
   * banniere de marque. Remplace le placeholder `__OG_IMAGE__`, qu'un rendu
   * serveur ne peut plus faire substituer par `entrypoint.sh`.
   */
  private get defaultImage(): string {
    return this.runtimeConfig.ogImage || this.fallbackImage;
  }

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
    articleAuthor?: string;
    articleSection?: string;
    articleTags?: string[];
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
      const fullUrl = this.toAbsoluteUrl(config.url);

      this.meta.updateTag({ property: 'og:url', content: fullUrl });
      this.updateCanonicalLink(fullUrl);
    }

    // Type Open Graph (article, website, etc.)
    this.meta.updateTag({ property: 'og:type', content: config.type ?? 'website' });

    // Images Open Graph et Twitter.
    //
    // Le repli ne vient plus du placeholder `__OG_IMAGE__` d'index.html : en
    // rendu serveur, index.html n'est pas le document servi et `entrypoint.sh`
    // ne peut plus l'alimenter. Une page sans image explicite laissait donc
    // sortir le placeholder brut dans le HTML lu par les scrapers.
    const image = config.image || this.defaultImage;
    if (image) {
      const fullImageUrl = this.toAbsoluteUrl(image);

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

    // Dates de publication et modification — préfixe article: (spec OpenGraph)
    // Supprime les anciennes balises og:article:* si elles existent (régression EPIC-23)
    this.meta.removeTag("property='og:article:published_time'");
    this.meta.removeTag("property='og:article:modified_time'");
    if (config.publishedTime) {
      this.meta.updateTag({ property: 'article:published_time', content: config.publishedTime });
    }
    if (config.modifiedTime) {
      this.meta.updateTag({ property: 'article:modified_time', content: config.modifiedTime });
    }

    // Métadonnées article optionnelles (article:author, article:section, article:tag)
    if (config.articleAuthor) {
      this.meta.updateTag({ property: 'article:author', content: config.articleAuthor });
    }
    if (config.articleSection) {
      this.meta.updateTag({ property: 'article:section', content: config.articleSection });
    }
    if (config.articleTags && config.articleTags.length > 0) {
      // Nettoie les anciennes balises article:tag avant d'en ajouter de nouvelles
      // (la spec OG permet la répétition — on repart de zéro pour éviter les doublons)
      this.meta.removeTag("property='article:tag'");
      config.articleTags.forEach(tag => {
        this.meta.addTag({ property: 'article:tag', content: tag });
      });
    }
  }

  /**
   * Met à jour ou crée le lien canonique
   * @param url URL canonique
   */
  /**
   * Absolutise un chemin en le raccordant a l'origine du site.
   *
   * Le separateur est normalise : sans lui, une valeur sans slash initial comme
   * `assets/img/hero.webp` produisait `https://teamdivergentes.frassets/...`,
   * une URL invalide que les scrapers sociaux rejettent en silence — la carte
   * s'affiche alors sans image.
   */
  private toAbsoluteUrl(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

    const origin = this.siteUrl.endsWith('/') ? this.siteUrl.slice(0, -1) : this.siteUrl;
    const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
    return `${origin}${path}`;
  }

  private updateCanonicalLink(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector(
      'link[rel="canonical"]'
    );

    if (link) {
      link.setAttribute('href', url);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }
  }

  /**
   * Supprime tous les scripts JSON-LD du head.
   */
  clearJsonLd(): void {
    this.document
      .querySelectorAll('script[type="application/ld+json"]')
      .forEach(el => el.remove());
  }

  /**
   * Ajoute ou met à jour les scripts JSON-LD dans le head.
   * Accepte un objet unique ou un tableau de schemas.
   *
   * Passe par `DOCUMENT` et non par le `document` global : le rendu serveur doit
   * emettre le JSON-LD dans le HTML envoye aux crawlers, c'est tout l'objet de
   * l'EPIC-29.
   *
   * @param data Données structured data (objet ou tableau)
   */
  setJsonLd(data: object | object[]): void {
    // Supprime tous les scripts JSON-LD existants
    this.clearJsonLd();

    // Normalise en tableau
    const schemas = Array.isArray(data) ? data : [data];
    schemas.forEach(schema => {
      const script = this.document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schema).replaceAll(/<\/script>/gi, '<\\/script>');
      this.document.head.appendChild(script);
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

  /**
   * Retourne le JSON-LD JobPosting pour une offre de recrutement (Google for Jobs)
   * @param post Données de l'offre
   */
  getJobPostingJsonLd(post: {
    title: string;
    description: string;
    createdAt: string | Date;
    expiresAt?: string | Date | null;
    slug: string;
  }): object {
    const datePosted = new Date(post.createdAt).toISOString();
    const validThrough = post.expiresAt
      ? new Date(post.expiresAt).toISOString()
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    return {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: post.title,
      description: post.description,
      datePosted,
      validThrough,
      employmentType: 'VOLUNTEER',
      hiringOrganization: {
        '@type': 'Organization',
        name: 'Team Divergentes',
        sameAs: this.siteUrl,
        logo: `${this.siteUrl}/assets/logos/logoTD.svg`,
      },
      jobLocation: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'FR',
        },
      },
      jobLocationType: 'TELECOMMUTE',
      directApply: false,
    };
  }

  /**
   * Retourne le JSON-LD Person pour une fiche joueur
   * @param player Données du joueur
   * @param team Données de l'équipe
   */
  getPersonJsonLd(
    player: { name: string; role?: string; image?: string },
    team: { name: string; game?: string },
  ): object {
    const schema: Record<string, unknown> = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: player.name,
      memberOf: {
        '@type': 'SportsTeam',
        name: team.name,
        ...(team.game ? { sport: team.game } : {}),
      },
    };

    if (player.role) {
      schema['jobTitle'] = player.role;
    }

    if (player.image) {
      schema['image'] = player.image.startsWith('http')
        ? player.image
        : `${this.siteUrl}${player.image}`;
    }

    return schema;
  }

  /**
   * Calcule le nombre de mots d'un contenu EditorJS (JSON stringifié).
   * Parse les blocs paragraph/header/list/quote, strip le HTML et compte les tokens.
   * @param contentJson Contenu EditorJS sous forme de string JSON ou objet
   */
  private countWordsFromEditorJs(contentJson: string | object): number {
    try {
      const parsed = typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson;
      const blocks: Array<{ type: string; data: Record<string, unknown> }> =
        Array.isArray(parsed?.blocks) ? parsed.blocks : [];

      const textParts: string[] = [];
      for (const block of blocks) {
        const type = block.type;
        const data = block.data ?? {};
        if (type === 'paragraph' || type === 'header' || type === 'quote') {
          if (typeof data['text'] === 'string') {
            textParts.push(data['text']);
          }
        } else if (type === 'list') {
          const items = data['items'];
          if (Array.isArray(items)) {
            items.forEach((item: unknown) => {
              if (typeof item === 'string') textParts.push(item);
              else if (typeof (item as Record<string, unknown>)?.['text'] === 'string') {
                textParts.push((item as Record<string, unknown>)['text'] as string);
              }
            });
          }
        }
      }

      const rawText = textParts.join(' ');
      const stripped = rawText.replaceAll(/<[^>]+>/g, ' ').trim();
      if (!stripped) return 0;
      return stripped.split(/\s+/).filter(Boolean).length;
    } catch {
      return 0;
    }
  }

  private resolveArticleImageUrl(imageUrl: string | undefined | null): string {
    if (!imageUrl) {
      return `${this.siteUrl}/assets/img/banniere-charte-graphique/images4k.jpg`;
    }
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${this.siteUrl}${imageUrl}`;
  }

  /**
   * Construit le JSON-LD Article enrichi (schema.org Article).
   * Inclut mainEntityOfPage, image ImageObject, articleSection, keywords,
   * wordCount, inLanguage, isPartOf et author.url.
   * @param article Données de l'article
   */
  buildArticleJsonLd(article: Article): object {
    const description = article.excerpt ?? '';
    const slug = article.slug;
    const articleUrl = `${this.siteUrl}/articles/${slug}`;

    const imageUrl = this.resolveArticleImageUrl(article.imageUrl);

    const articleSection = article.type?.name;
    // Pas de champ tags/keywords en BDD — fallback sur le nom du type comme keyword unique
    const keywords: string[] = articleSection ? [articleSection] : [];
    const wordCount = this.countWordsFromEditorJs(article.content);

    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': articleUrl,
      },
      headline: article.title,
      description,
      image: {
        '@type': 'ImageObject',
        url: imageUrl,
        width: 1200,
        height: 630,
      },
      datePublished: article.createdAt,
      dateModified: article.updatedAt,
      author: {
        '@type': 'Organization',
        name: 'Team Divergentes',
        url: this.siteUrl,
      },
      publisher: {
        '@type': 'Organization',
        name: 'Team Divergentes',
        logo: {
          '@type': 'ImageObject',
          url: `${this.siteUrl}/assets/logos/logoTD.svg`,
        },
      },
      ...(articleSection ? { articleSection } : {}),
      ...(keywords.length > 0 ? { keywords: keywords.join(', ') } : {}),
      ...(wordCount > 0 ? { wordCount } : {}),
      inLanguage: 'fr-FR',
      isPartOf: {
        '@type': 'WebSite',
        '@id': `${this.siteUrl}/#website`,
        name: 'Team Divergentes',
      },
    };
  }

  /**
   * Retourne le JSON-LD BreadcrumbList pour le fil d'Ariane
   * @param items Liste des éléments (name + url)
   */
  getBreadcrumbListJsonLd(items: { name: string; url: string }[]): object {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${this.siteUrl}${item.url}`,
      })),
    };
  }
}
