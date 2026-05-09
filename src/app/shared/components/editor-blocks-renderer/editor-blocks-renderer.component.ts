import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  SecurityContext,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { inject } from '@angular/core';

/** Domaines autorisés pour les embeds (HTTPS uniquement) */
const EMBED_ALLOWED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'twitch.tv',
  'player.twitch.tv',
  'clips.twitch.tv',
  'open.spotify.com',
  'vimeo.com',
  'dailymotion.com',
  'twitter.com',
  'x.com',
  'platform.twitter.com',
  'publish.twitter.com',
];

/** Bloc générique Editor.js */
export interface EditorBlock {
  type: string;
  data: Record<string, unknown>;
  tunes?: Record<string, unknown>;
}

/** Structure de sortie Editor.js */
export interface EditorData {
  time?: number;
  blocks: EditorBlock[];
  version?: string;
}

/** Bloc header parsé */
export interface HeaderBlock extends EditorBlock {
  type: 'header';
  data: { text: string; level: 1 | 2 | 3 | 4 | 5 | 6 };
}

/** Bloc paragraph parsé */
export interface ParagraphBlock extends EditorBlock {
  type: 'paragraph';
  data: { text: string };
}

/** Bloc image parsé */
export interface ImageBlock extends EditorBlock {
  type: 'image';
  data: {
    file: { url: string };
    caption?: string;
    withBorder?: boolean;
    stretched?: boolean;
    withBackground?: boolean;
  };
}

/** Item de liste (format v2 : objet avec content, ou string simple) */
export type ListItem = string | { content: string; items?: ListItem[]; meta?: { checked?: boolean } };

/** Bloc liste parsé */
export interface ListBlock extends EditorBlock {
  type: 'list';
  data: { style: 'ordered' | 'unordered' | 'checklist'; items: ListItem[] };
}

/** Bloc citation parsé */
export interface QuoteBlock extends EditorBlock {
  type: 'quote';
  data: { text: string; caption?: string; alignment?: string };
}

/** Bloc embed parsé */
export interface EmbedBlock extends EditorBlock {
  type: 'embed';
  data: {
    service: string;
    source: string;
    embed: string;
    width?: number;
    height?: number;
    caption?: string;
  };
}

/** Bloc link parsé */
export interface LinkBlock extends EditorBlock {
  type: 'linkTool';
  data: {
    link: string;
    meta?: {
      title?: string;
      description?: string;
      image?: { url?: string };
    };
  };
}

/** Union de tous les blocs reconnus */
export type KnownBlock =
  | HeaderBlock
  | ParagraphBlock
  | ImageBlock
  | ListBlock
  | QuoteBlock
  | EmbedBlock
  | LinkBlock
  | EditorBlock;

/**
 * Composant de rendu du contenu Editor.js.
 *
 * Prend en input un JSON string ou objet Editor.js et rend chaque bloc
 * en HTML Angular avec la charte graphique DVG.
 *
 * Blocs supportés : header, paragraph, image, list, quote, delimiter, embed, linkTool.
 */
@Component({
  selector: 'app-editor-blocks-renderer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editor-blocks-renderer.component.html',
  styleUrls: ['./editor-blocks-renderer.component.scss'],
})
export class EditorBlocksRendererComponent {
  private readonly sanitizer = inject(DomSanitizer);

  /** JSON string ou objet Editor.js */
  readonly content = input<string | undefined>(undefined);

  /** Blocs parsés et prêts au rendu */
  readonly blocks = computed<KnownBlock[]>(() => {
    const raw = this.content();
    if (!raw) return [];

    let parsed: EditorData;
    try {
      parsed = JSON.parse(raw) as EditorData;
    } catch {
      return [];
    }

    if (!parsed?.blocks || !Array.isArray(parsed.blocks)) return [];
    return parsed.blocks as KnownBlock[];
  });

  /**
   * Retourne le texte d'un bloc HTML sanitisé via Angular DomSanitizer.
   * Le contenu provient d'Editor.js (source admin de confiance) mais on
   * utilise la sanitisation stricte pour supprimer les scripts injectables.
   */
  sanitizeHtml(html: string): string {
    return this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  }

  /**
   * Sanitise une URL de lien en bloquant les schémas dangereux
   * (javascript:, data:, vbscript:). Retourne '#' si l'URL est bloquée.
   */
  safeLinkUrl(url: string): string {
    const trimmed = url.trim().toLowerCase();
    if (
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:') ||
      trimmed.startsWith('vbscript:')
    ) {
      return '#';
    }
    return this.sanitizer.sanitize(SecurityContext.URL, url) ?? '#';
  }

  /**
   * Vérifie que l'URL d'embed appartient à un domaine autorisé et utilise HTTPS.
   * Retourne null si l'URL n'est pas conforme (pas de rendu iframe).
   */
  safeEmbedUrl(url: string): SafeResourceUrl | null {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:') return null;
      const isAllowed = EMBED_ALLOWED_DOMAINS.some(
        (domain) => parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      );
      if (!isAllowed) return null;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    } catch {
      return null;
    }
  }

  /**
   * Extrait le texte d'un item de liste (supporte string et objet {content}).
   */
  getListItemText(item: ListItem): string {
    if (typeof item === 'string') return item;
    return item.content ?? '';
  }

  /**
   * Retourne les items de liste sous forme de strings.
   */
  getListItems(block: KnownBlock): string[] {
    const listBlock = block as ListBlock;
    return (listBlock.data.items ?? []).map(item => this.getListItemText(item));
  }

  /**
   * Détecte si une URL est une vidéo (YouTube, Vimeo, Dailymotion, Twitch)
   * et retourne l'URL d'embed correspondante. Retourne null si ce n'est pas une vidéo.
   */
  getVideoEmbedUrl(url: string): string | null {
    try {
      const parsed = new URL(url);

      // YouTube
      if (parsed.hostname.includes('youtube.com') || parsed.hostname.includes('youtu.be')) {
        let videoId: string | null = null;
        if (parsed.hostname.includes('youtu.be')) {
          videoId = parsed.pathname.slice(1);
        } else {
          videoId = parsed.searchParams.get('v');
        }
        if (videoId) {
          let embedUrl = `https://www.youtube.com/embed/${videoId}`;
          const t = parsed.searchParams.get('t');
          if (t) {
            const seconds = parseInt(t, 10);
            if (!isNaN(seconds)) embedUrl += `?start=${seconds}`;
          }
          return embedUrl;
        }
      }

      // Vimeo
      if (parsed.hostname.includes('vimeo.com')) {
        const match = parsed.pathname.match(/\/(\d+)/);
        if (match) return `https://player.vimeo.com/video/${match[1]}`;
      }

      // Dailymotion
      if (parsed.hostname.includes('dailymotion.com')) {
        const match = parsed.pathname.match(/\/video\/([a-z0-9]+)/i);
        if (match) return `https://www.dailymotion.com/embed/video/${match[1]}`;
      }

      // Twitch
      if (parsed.hostname.includes('twitch.tv')) {
        // Clip URL: twitch.tv/{channel}/clip/{clipId}
        const clipMatch = parsed.pathname.match(/\/[^/]+\/clip\/([a-zA-Z0-9_-]+)/);
        if (clipMatch) {
          return `https://clips.twitch.tv/embed?clip=${clipMatch[1]}&${this.twitchParentQuery}`;
        }
        // Video URL: twitch.tv/videos/{videoId}
        const videoMatch = parsed.pathname.match(/\/videos\/(\d+)/);
        if (videoMatch) {
          return `https://player.twitch.tv/?video=v${videoMatch[1]}&${this.twitchParentQuery}`;
        }
        // Channel URL: twitch.tv/{channel}
        const channel = parsed.pathname.slice(1).split('/')[0];
        if (channel) return `https://player.twitch.tv/?channel=${channel}&${this.twitchParentQuery}`;
      }

      // Twitter / X — détecte les URLs de tweets et génère l'embed platform.twitter.com
      if (parsed.hostname.includes('twitter.com') || parsed.hostname.includes('x.com')) {
        const match = parsed.pathname.match(/\/status\/(\d+)/);
        if (match) return `https://platform.twitter.com/embed/Tweet.html?id=${match[1]}&theme=dark&dnt=true`;
      }
    } catch {
      // URL invalide
    }
    return null;
  }

  private get twitchParentQuery(): string {
    const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    return `parent=${host}`;
  }

  /**
   * Retourne la valeur de l'attribut sandbox adaptée selon l'URL d'embed.
   * Les embeds Twitter nécessitent allow-popups pour les interactions
   * (like, follow, retweet depuis l'iframe).
   */
  getSandboxPolicy(embedUrl: string): string {
    const base = 'allow-scripts allow-same-origin allow-presentation';
    try {
      const parsed = new URL(embedUrl);
      if (
        parsed.hostname.includes('twitter.com') ||
        parsed.hostname.includes('x.com') ||
        parsed.hostname === 'platform.twitter.com' ||
        parsed.hostname === 'publish.twitter.com'
      ) {
        return `${base} allow-popups allow-popups-to-escape-sandbox allow-forms`;
      }
    } catch {
      // URL invalide : on retourne le sandbox de base
    }
    return base;
  }

  /**
   * Retourne le preset de taille d'un bloc image depuis ses tunes.
   * Valeur par défaut : 'full' (comportement identique à l'existant).
   */
  getImageSize(block: KnownBlock): string {
    return (block.tunes?.['imageSize'] as string) || 'full';
  }

  /** Type guards pour le template */
  asHeader(block: KnownBlock): HeaderBlock {
    return block as HeaderBlock;
  }

  asParagraph(block: KnownBlock): ParagraphBlock {
    return block as ParagraphBlock;
  }

  asImage(block: KnownBlock): ImageBlock {
    return block as ImageBlock;
  }

  asList(block: KnownBlock): ListBlock {
    return block as ListBlock;
  }

  asQuote(block: KnownBlock): QuoteBlock {
    return block as QuoteBlock;
  }

  asEmbed(block: KnownBlock): EmbedBlock {
    return block as EmbedBlock;
  }

  asLink(block: KnownBlock): LinkBlock {
    return block as LinkBlock;
  }

  /**
   * Détecte si une URL d'embed pointe vers platform.twitter.com ou publish.twitter.com.
   */
  isTwitterEmbed(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.hostname === 'platform.twitter.com' || parsed.hostname === 'publish.twitter.com';
    } catch { return false; }
  }

  /**
   * Ajoute les paramètres de thème sombre à une URL d'embed Twitter/X.
   * Retourne l'URL inchangée si elle n'est pas un embed Twitter.
   */
  enhanceTwitterEmbedUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'platform.twitter.com' || parsed.hostname === 'publish.twitter.com') {
        parsed.searchParams.set('theme', 'dark');
        parsed.searchParams.set('dnt', 'true');
        return parsed.toString();
      }
    } catch {
      // Invalid URL — return original
    }
    return url;
  }

  /**
   * Détecte si une URL est un profil Twitter/X (pas un tweet, pas un hashtag).
   */
  isTwitterProfileUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (!parsed.hostname.includes('twitter.com') && !parsed.hostname.includes('x.com')) return false;
      const path = parsed.pathname.replace(/^\//, '').replace(/\/$/, '');
      if (!path || path.includes('/')) return false;
      const reserved = ['home', 'explore', 'search', 'settings', 'i', 'hashtag', 'intent', 'tos', 'privacy'];
      return !reserved.includes(path.toLowerCase());
    } catch { return false; }
  }

  /**
   * Extrait le username depuis une URL de profil Twitter/X.
   */
  getTwitterUsername(url: string): string | null {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname.replace(/^\//, '').replace(/\/$/, '');
      return path || null;
    } catch { return null; }
  }
}
