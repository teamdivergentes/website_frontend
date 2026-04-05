/**
 * ImageSizeTune - Block Tune Editor.js pour les blocs image.
 *
 * Ajoute 4 presets de taille (S/M/L/Full) dans le panneau de réglages
 * d'un bloc image. Applique une classe CSS sur le wrapper du bloc pour
 * un aperçu en temps réel dans l'éditeur.
 *
 * API Block Tune : https://editorjs.io/block-tunes
 */

export type ImageSize = 'small' | 'medium' | 'large' | 'full';

interface ImageSizeTuneData {
  size: ImageSize;
}

interface TuneConfig {
  api: unknown;
  data: ImageSizeTuneData | null;
}

const PRESETS: { value: ImageSize; label: string; title: string }[] = [
  { value: 'small', label: 'S', title: 'Petite (25%)' },
  { value: 'medium', label: 'M', title: 'Moyenne (50%)' },
  { value: 'large', label: 'L', title: 'Grande (75%)' },
  { value: 'full', label: 'Full', title: 'Pleine largeur (100%)' },
];

const CSS_PREFIX = 'cdx-image-size';
const DEFAULT_SIZE: ImageSize = 'full';

export class ImageSizeTune {
  static get isTune(): boolean {
    return true;
  }

  private currentSize: ImageSize;
  private wrapper: HTMLElement | null = null;

  constructor({ data }: TuneConfig) {
    this.currentSize = (data as ImageSize | null) ?? DEFAULT_SIZE;
  }

  /**
   * Rend les boutons de preset dans le panneau de réglages Editor.js.
   */
  render(): HTMLElement {
    const container = document.createElement('div');
    container.classList.add(`${CSS_PREFIX}-tune`);

    const label = document.createElement('div');
    label.classList.add(`${CSS_PREFIX}-tune__label`);
    label.textContent = 'Taille de l\'image';
    container.appendChild(label);

    const buttons = document.createElement('div');
    buttons.classList.add(`${CSS_PREFIX}-tune__buttons`);

    for (const preset of PRESETS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.classList.add(`${CSS_PREFIX}-tune__btn`);
      btn.textContent = preset.label;
      btn.title = preset.title;

      if (this.currentSize === preset.value) {
        btn.classList.add(`${CSS_PREFIX}-tune__btn--active`);
      }

      btn.addEventListener('click', () => {
        this.setSize(preset.value, buttons);
      });

      buttons.appendChild(btn);
    }

    container.appendChild(buttons);
    return container;
  }

  /**
   * Entoure le contenu du bloc avec un wrapper auquel on applique
   * la classe de taille CSS pour le preview en temps réel.
   */
  wrap(blockContent: HTMLElement): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add(`${CSS_PREFIX}--${this.currentSize}`);
    this.wrapper.appendChild(blockContent);
    return this.wrapper;
  }

  /**
   * Retourne la valeur sélectionnée, persistée dans le JSON Editor.js.
   */
  save(): ImageSize {
    return this.currentSize;
  }

  // ──────────────────────────────────────────────
  // Méthodes privées
  // ──────────────────────────────────────────────

  private setSize(size: ImageSize, buttonsContainer: HTMLElement): void {
    // Mettre à jour la classe sur le wrapper (preview en temps réel)
    if (this.wrapper) {
      this.wrapper.classList.remove(
        `${CSS_PREFIX}--small`,
        `${CSS_PREFIX}--medium`,
        `${CSS_PREFIX}--large`,
        `${CSS_PREFIX}--full`,
      );
      this.wrapper.classList.add(`${CSS_PREFIX}--${size}`);
    }

    // Mettre à jour l'état actif des boutons
    const btns = buttonsContainer.querySelectorAll<HTMLButtonElement>(`.${CSS_PREFIX}-tune__btn`);
    btns.forEach((btn, index) => {
      if (PRESETS[index].value === size) {
        btn.classList.add(`${CSS_PREFIX}-tune__btn--active`);
      } else {
        btn.classList.remove(`${CSS_PREFIX}-tune__btn--active`);
      }
    });

    this.currentSize = size;
  }
}
