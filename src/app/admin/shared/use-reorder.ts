import { DestroyRef, inject, Signal, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { finalize, Observable } from 'rxjs';
import {
  buildReorderErrorMessage,
  buildReorderMessage,
} from '../../shared/utils/a11y-announce';

/** Evenement minimal d'un `cdkDropList`. */
export interface ReorderDropEvent {
  previousIndex: number;
  currentIndex: number;
}

export interface ReorderConfig<T> {
  /** Collection courante, dans son ordre affiche. */
  items: Signal<T[]>;
  /** Libelle de l'element, pour l'annonce accessible. */
  label: (item: T) => string;
  /**
   * Persiste le nouvel ordre.
   *
   * Recoit la liste reordonnee et non un format impose : c'est ce qui permet
   * d'absorber les deux contrats coexistants — `{id, position}[]` pour la
   * plupart des services, `number[]` pour les chaines Twitch.
   */
  persist: (ordered: T[]) => Observable<unknown>;
  onSuccess?: () => void;
  /** Appele en cas d'echec, typiquement pour recharger et annuler l'affichage. */
  onError?: (err: unknown) => void;
  /**
   * Applique le nouvel ordre a l'affichage sans attendre le serveur.
   *
   * Obligatoire pour le deplacement au clavier : sans retour visuel immediat,
   * les fleches ne montrent rien tant que la ligne n'est pas deposee.
   */
  applyOptimistic?: (ordered: T[]) => void;
}

export interface ReorderHandle {
  /** Vrai tant qu'une persistance est en cours. */
  reordering: Signal<boolean>;
  /** Message a placer dans une region `aria-live`. */
  liveMessage: Signal<string>;
  /** Index de la ligne saisie au clavier, `-1` si aucune. */
  grabbedIndex: Signal<number>;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDrop: (event: ReorderDropEvent) => void;
  /** A brancher sur le `keydown` de la poignee de glissement. */
  onHandleKeydown: (event: KeyboardEvent, currentIndex: number) => void;
}

/**
 * Mecanique de reordonnancement partagee.
 *
 * L'audit du 2026-07-29 a releve **huit implementations** du meme squelette,
 * soit ~330 lignes : garde de concurrence, copie du tableau, `moveItemInArray`,
 * calcul des positions, persistance, annonce accessible, rollback.
 *
 * Seuls variaient le contrat d'API et les effets annexes — absorbes ici par
 * `persist`, `onSuccess` et `onError`.
 *
 * La garde de concurrence etait par ailleurs **absente d'une des huit**
 * (`team-members-dialog`) : un double-clic y declenchait deux appels API
 * concurrents sur la meme collection. La centraliser rend l'oubli impossible.
 *
 * A appeler dans un contexte d'injection (initialisation de champ ou
 * constructeur).
 */
export function createReorder<T>(config: ReorderConfig<T>): ReorderHandle {
  const destroyRef = inject(DestroyRef);
  const reordering = signal(false);
  const liveMessage = signal('');
  const grabbedIndex = signal(-1);
  /** Ordre d'avant la saisie clavier, restaure par Echap. */
  let grabSnapshot: T[] = [];

  function onReorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    if (reordering()) return;

    const ordered = [...config.items()];
    moveItemInArray(ordered, fromIndex, toIndex);
    config.applyOptimistic?.(ordered);
    persistOrder(ordered, toIndex);
  }

  /** Persiste un ordre deja calcule et annonce le resultat. */
  function persistOrder(ordered: T[], toIndex: number): void {
    reordering.set(true);
    const moved = ordered[toIndex];

    config
      .persist(ordered)
      .pipe(
        finalize(() => reordering.set(false)),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe({
        next: () => {
          if (moved) {
            liveMessage.set(
              buildReorderMessage(config.label(moved), toIndex + 1, ordered.length),
            );
          }
          config.onSuccess?.();
        },
        error: (err: unknown) => {
          if (moved) {
            liveMessage.set(buildReorderErrorMessage(config.label(moved)));
          }
          config.onError?.(err);
        },
      });
  }

  /**
   * Saisit la ligne survolee, ou depose celle deja saisie en persistant l'ordre
   * courant — il a deja ete applique a l'affichage par les fleches.
   */
  function toggleGrab(currentIndex: number): void {
    if (grabbedIndex() === -1) {
      if (reordering()) return;
      grabSnapshot = [...config.items()];
      grabbedIndex.set(currentIndex);
      return;
    }

    const index = grabbedIndex();
    grabbedIndex.set(-1);
    persistOrder([...config.items()], index);
  }

  /** Abandonne le deplacement et restaure l'ordre d'avant la saisie. */
  function cancelGrab(): void {
    config.applyOptimistic?.(grabSnapshot);
    grabbedIndex.set(-1);
    liveMessage.set('Déplacement annulé.');
  }

  /**
   * Deplace la ligne saisie d'un cran. Le deplacement reste optimiste : il n'est
   * persiste qu'au depot, pour ne pas emettre un appel par touche.
   */
  function moveGrabbed(delta: number): void {
    const from = grabbedIndex();
    const total = config.items().length;
    const to = from + delta;
    if (to < 0 || to >= total) return;

    const ordered = [...config.items()];
    moveItemInArray(ordered, from, to);
    config.applyOptimistic?.(ordered);
    grabbedIndex.set(to);

    const moved = ordered[to];
    if (moved) {
      liveMessage.set(buildReorderMessage(config.label(moved), to + 1, total));
    }
  }

  function onHandleKeydown(event: KeyboardEvent, currentIndex: number): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggleGrab(currentIndex);
      return;
    }

    // Les touches suivantes n'ont de sens qu'en etat saisi.
    if (grabbedIndex() === -1) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      cancelGrab();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      moveGrabbed(event.key === 'ArrowDown' ? 1 : -1);
    }
  }

  return {
    reordering: reordering.asReadonly(),
    liveMessage: liveMessage.asReadonly(),
    grabbedIndex: grabbedIndex.asReadonly(),
    onReorder,
    onDrop: (event) => onReorder(event.previousIndex, event.currentIndex),
    onHandleKeydown,
  };
}
