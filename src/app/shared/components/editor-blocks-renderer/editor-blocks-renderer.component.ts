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
  'open.spotify.com',
  'vimeo.com',
  'dailymotion.com',
];

/** Bloc générique Editor.js */
export interface EditorBlock {
  type: string;
  data: Record<string, unknown>;
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

    let parsed: EditorData | null = null;
    if (typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw) as EditorData;
      } catch {
        return [];
      }
    } else {
      parsed = raw as unknown as EditorData;
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
}
