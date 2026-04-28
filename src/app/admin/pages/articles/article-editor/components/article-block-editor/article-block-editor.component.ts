import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  OnDestroy,
  ViewChild,
  afterNextRender,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import EditorJS from '@editorjs/editorjs';
import DragDrop from 'editorjs-drag-drop';
import { ArticleBlocksService } from '../../services/article-blocks.service';

/**
 * Composant responsable de l'instance EditorJS.
 * Gère le cycle de vie (init, render, destroy) et délègue la configuration
 * des blocs à ArticleBlocksService.
 *
 * Inputs :
 * - existingContent : JSON string du contenu à charger (optionnel)
 *
 * Outputs :
 * - editorReady : émis quand l'éditeur est prêt
 * - editorInstance : émis avec l'instance EditorJS une fois prête
 */
@Component({
  selector: 'app-article-block-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="editor-container"
      #editorContainer
      aria-label="Éditeur de contenu"
      role="region"
    >
      @if (!ready()) {
        <div class="editor-placeholder" role="status" aria-label="Chargement de l'éditeur">
          <div class="spinner-small"></div>
          Chargement de l'éditeur...
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .editor-container {
        min-height: 400px;
        background: var(--lightBlack);
        border: 1px solid rgba(40, 65, 59, 0.6);
        border-radius: 8px;
        padding: 1rem;
        position: relative;
        transition: border-color 0.2s ease;

        &:focus-within {
          border-color: var(--green);
          box-shadow: 0 0 0 3px rgba(50, 210, 153, 0.08);
        }
      }

      .editor-placeholder {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        color: rgba(211, 211, 211, 0.4);
        font-size: 0.875rem;
        padding: 1rem;
      }

      .spinner-small {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(0, 0, 0, 0.15);
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        flex-shrink: 0;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
})
export class ArticleBlockEditorComponent implements OnDestroy {
  @ViewChild('editorContainer', { static: false }) editorContainer!: ElementRef<HTMLDivElement>;

  readonly existingContent = input<string | undefined>(undefined);

  readonly editorReady = output<EditorJS>();

  readonly ready = signal(false);

  private readonly blocksService = inject(ArticleBlocksService);
  private readonly injector = inject(Injector);

  private editor: EditorJS | null = null;
  private dragDrop: DragDrop | null = null;

  /**
   * Initialise l'éditeur EditorJS.
   * Appelé depuis le composant parent après le chargement des données.
   */
  init(): void {
    afterNextRender(
      () => {
        this.initEditor();
      },
      { injector: this.injector },
    );
  }

  /**
   * Retourne l'instance EditorJS active (ou null).
   */
  getEditor(): EditorJS | null {
    return this.editor;
  }

  ngOnDestroy(): void {
    this.destroyEditor();
  }

  private initEditor(): void {
    if (!this.editorContainer?.nativeElement) return;

    this.destroyEditor();

    const content = this.existingContent();
    let parsedData: object | undefined;
    if (content) {
      try {
        parsedData = JSON.parse(content);
      } catch {
        // Contenu non JSON — éditeur initialisé vide
      }
    }

    // Ne PAS passer data dans le constructeur : les blocs embed
    // nécessitent que prepare() soit terminé avant leur rendu.
    // On charge les données via editor.render() dans onReady.
    this.editor = new EditorJS({
      holder: this.editorContainer.nativeElement,
      placeholder: 'Commencez à écrire votre article...',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tools: this.blocksService.buildTools() as any,
      tunes: ['textVariant'],
      onReady: () => {
        if (parsedData && this.editor) {
          this.editor
            .render(parsedData as Parameters<typeof EditorJS.prototype['render']>[0])
            .then(() => {
              this.dragDrop = new DragDrop(this.editor!);
              this.ready.set(true);
              this.editorReady.emit(this.editor!);
            });
        } else {
          this.dragDrop = new DragDrop(this.editor!);
          this.ready.set(true);
          this.editorReady.emit(this.editor!);
        }
      },
    });
  }

  private destroyEditor(): void {
    if (this.dragDrop) {
      this.dragDrop.destroy();
      this.dragDrop = null;
    }
    if (this.editor) {
      this.editor.destroy();
      this.editor = null;
      this.ready.set(false);
    }
  }
}
