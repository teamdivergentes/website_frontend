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
}

export interface ReorderHandle {
  /** Vrai tant qu'une persistance est en cours. */
  reordering: Signal<boolean>;
  /** Message a placer dans une region `aria-live`. */
  liveMessage: Signal<string>;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDrop: (event: ReorderDropEvent) => void;
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

  function onReorder(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex) return;
    if (reordering()) return;
    reordering.set(true);

    const ordered = [...config.items()];
    moveItemInArray(ordered, fromIndex, toIndex);
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

  return {
    reordering: reordering.asReadonly(),
    liveMessage: liveMessage.asReadonly(),
    onReorder,
    onDrop: (event) => onReorder(event.previousIndex, event.currentIndex),
  };
}
