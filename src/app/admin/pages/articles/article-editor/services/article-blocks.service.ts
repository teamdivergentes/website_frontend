import { Injectable } from '@angular/core';
import { ToolConstructable } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import Paragraph from '@editorjs/paragraph';
import ImageTool from '@editorjs/image';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import Delimiter from '@editorjs/delimiter';
import Embed from '@editorjs/embed';
import TextVariantTune from '@editorjs/text-variant-tune';
import { LinkToolWrapper } from '../../link-tool-wrapper';
import { ImageSizeTune } from '../../image-size-tune';
import { environment } from '../../../../../../environments/environment';

/**
 * Service responsable de la configuration des outils EditorJS.
 * Centralise la définition des blocs et tunes pour l'éditeur d'articles.
 * Les cookies HttpOnly sont envoyés automatiquement via withCredentials (ApiService global).
 */
@Injectable({ providedIn: 'root' })
export class ArticleBlocksService {
  /**
   * Retourne la configuration complète des outils EditorJS.
   * Les casts `as unknown as ToolConstructable` sont requis par le strict mode
   * TypeScript : les plugins EditorJS ne typent pas correctement leur classe.
   * Marqués false positive sur SonarQube — ne pas modifier.
   */
  buildTools(): Record<string, unknown> {
    const uploadUrl = `${environment.apiUrl}/api/upload/image-editor`;

    return {
      header: {
        class: Header as unknown as ToolConstructable,
        config: {
          placeholder: 'Titre de la section',
          levels: [2, 3],
          defaultLevel: 2,
        },
      },
      paragraph: {
        class: Paragraph as unknown as ToolConstructable,
        inlineToolbar: true,
        config: {
          placeholder: 'Paragraphe...',
        },
      },
      image: {
        class: ImageTool as unknown as ToolConstructable,
        tunes: ['imageSize'],
        config: {
          endpoints: {
            byFile: uploadUrl,
            byUrl: uploadUrl,
          },
          // Les cookies HttpOnly sont envoyés automatiquement via withCredentials
          additionalRequestHeaders: {},
          field: 'file',
        },
      },
      list: {
        class: List as unknown as ToolConstructable,
        inlineToolbar: true,
        config: {
          defaultStyle: 'unordered',
          styles: ['ordered', 'unordered'],
        },
      },
      quote: {
        class: Quote as unknown as ToolConstructable,
        inlineToolbar: true,
        config: {
          quotePlaceholder: 'Citation...',
          captionPlaceholder: 'Source',
        },
      },
      delimiter: Delimiter as unknown as ToolConstructable,
      embed: {
        class: Embed as unknown as ToolConstructable,
        config: {
          services: {
            youtube: true,
            vimeo: true,
            twitter: true,
            'twitch-clip': {
              regex: /https?:\/\/(?:www\.)?twitch\.tv\/[a-zA-Z0-9_-]+\/clip\/([a-zA-Z0-9_-]+)/,
              embedUrl:
                'https://clips.twitch.tv/embed?clip=<%= remote_id %>&parent=localhost&parent=teamdivergentes.fr',
              html: '<iframe width="100%" height="300" style="border:none;" allowfullscreen></iframe>',
            },
            'twitch-video': {
              regex: /https?:\/\/(?:www\.)?twitch\.tv\/videos\/(\d+)/,
              embedUrl:
                'https://player.twitch.tv/?video=v<%= remote_id %>&parent=localhost&parent=teamdivergentes.fr',
              html: '<iframe width="100%" height="300" style="border:none;" allowfullscreen></iframe>',
            },
            twitch: {
              regex: /https?:\/\/(?:www\.)?twitch\.tv\/([a-zA-Z0-9_-]+)\/?$/,
              embedUrl:
                'https://player.twitch.tv/?channel=<%= remote_id %>&parent=localhost&parent=teamdivergentes.fr',
              html: '<iframe width="100%" height="300" style="border:none;" allowfullscreen></iframe>',
            },
            dailymotion: true,
            spotify: {
              regex: /https?:\/\/open\.spotify\.com\/(track|playlist|album|episode)\/([a-zA-Z0-9]+)/,
              embedUrl: 'https://open.spotify.com/embed/<%= remote_id %>',
              html: '<iframe width="100%" height="380" style="border:none;" allowfullscreen></iframe>',
              id: (groups: string[]) => `${groups[0]}/${groups[1]}`,
            },
          },
        },
      },
      linkTool: {
        class: LinkToolWrapper as unknown as ToolConstructable,
        config: {
          endpoint: `${environment.apiUrl}/api/articles/link-meta`,
          // Les cookies HttpOnly sont envoyés automatiquement
          headers: {},
        },
      },
      textVariant: {
        class: TextVariantTune as unknown as ToolConstructable,
      },
      imageSize: {
        class: ImageSizeTune as unknown as ToolConstructable,
      },
    };
  }
}
