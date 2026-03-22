import LinkTool from '@editorjs/link';

/**
 * Wrapper autour de @editorjs/link qui garantit que l'URL sauvegardée
 * est toujours visible dans l'éditeur, même sans métadonnées.
 *
 * Problème d'origine : quand `meta` est vide (endpoint /api/articles/link-meta
 * inexistant), le plugin affiche l'input vide avec data-empty="true" et rien
 * n'est visible au rechargement.
 *
 * Solution : après le rendu, si une URL est présente dans les données mais
 * que l'UI ne l'affiche pas, on force l'affichage via un élément fallback
 * construit uniquement avec des méthodes DOM sûres (pas d'innerHTML).
 */
export class LinkToolWrapper extends (LinkTool as any) {

  render(): HTMLElement {
    const wrapper = super.render() as HTMLElement;

    // Si on a un lien sauvegardé, s'assurer qu'il est visible après le rendu
    if ((this as any).data?.link) {
      setTimeout(() => this.ensureLinkVisible(), 100);
    }

    return wrapper;
  }

  private ensureLinkVisible(): void {
    const link = (this as any).data?.link as string | undefined;
    if (!link) return;

    const wrapper = (this as any).nodes?.wrapper as HTMLElement | undefined;
    if (!wrapper) return;

    const input = wrapper.querySelector<HTMLElement>('.link-tool__input');
    const content = wrapper.querySelector<HTMLElement>('.link-tool__content');

    // Si le contenu preview existe et contient du texte visible, ne pas interférer
    if (content) {
      const anchor = content.querySelector('.link-tool__anchor');
      if (anchor?.textContent?.trim()) return;
    }

    // Si l'input est vide ou marqué data-empty, le remplir avec l'URL
    if (input && (!input.textContent?.trim() || input.getAttribute('data-empty') === 'true')) {
      const inputHolder = wrapper.querySelector<HTMLElement>('.link-tool__input-holder');
      if (inputHolder) {
        inputHolder.style.display = '';
      }

      input.textContent = link;
      input.removeAttribute('data-empty');

      // Cacher le preview vide s'il ne contient pas de texte utile
      if (content && !content.textContent?.trim()) {
        content.style.display = 'none';
      }

      return;
    }

    // Si ni l'input ni le content ne montrent le lien, créer un élément fallback
    // en utilisant uniquement des méthodes DOM sûres (pas d'innerHTML)
    const alreadyHasFallback = wrapper.querySelector('.link-tool__url-fallback');
    if (!alreadyHasFallback && !input?.textContent?.trim() && !content?.textContent?.trim()) {
      const fallback = document.createElement('div');
      fallback.className = 'link-tool__url-fallback';

      const anchor = document.createElement('a');
      anchor.href = link;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = link;

      fallback.appendChild(anchor);

      const container = wrapper.querySelector('.link-tool') ?? wrapper;
      container.appendChild(fallback);
    }
  }
}
