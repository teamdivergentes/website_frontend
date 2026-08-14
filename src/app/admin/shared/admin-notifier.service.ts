import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/** Genre grammatical de l'entite, pour accorder les participes passes. */
export type EntityGender = 'm' | 'f';

/** Nature de l'enregistrement, pour choisir entre "cree" et "mis a jour". */
export type SaveMode = 'create' | 'edit';

/**
 * Point unique de notification pour le panel d'administration.
 *
 * L'audit du 2026-07-29 a releve 48 appels directs a `MatSnackBar.open` avec
 * **5 durees** (2000/2500/3000/4000/5000 ms) et **2 libelles d'action**
 * (`OK` et `Fermer`) melanges sans corelation stable succes/erreur — et surtout
 * 5 suppressions et 4 creations qui ne notifiaient rien du tout.
 *
 * Regles retenues :
 * - succes : 2500 ms, action `OK` ;
 * - erreur : 5000 ms, action `Fermer` — l'utilisateur doit avoir le temps de lire.
 */
@Injectable({ providedIn: 'root' })
export class AdminNotifier {
  private readonly snackBar = inject(MatSnackBar);

  private static readonly SUCCESS: MatSnackBarConfig = { duration: 2500 };
  private static readonly ERROR: MatSnackBarConfig = { duration: 5000 };

  /** Confirmation d'une action reussie. */
  success(message: string): void {
    this.snackBar.open(message, 'OK', AdminNotifier.SUCCESS);
  }

  /** Erreur non bloquante. Pour une erreur de chargement, preferer `<app-error-state>`. */
  error(message: string): void {
    this.snackBar.open(message, 'Fermer', AdminNotifier.ERROR);
  }

  /** Information neutre. */
  info(message: string): void {
    this.snackBar.open(message, 'OK', AdminNotifier.SUCCESS);
  }

  /**
   * Confirmation de suppression.
   * @param entity - Nom de l'entite, capitalise (ex. "Jeu", "Equipe").
   * @param gender - Genre, pour accorder le participe. Masculin par defaut.
   */
  deleted(entity: string, gender: EntityGender = 'm'): void {
    this.success(`${entity} supprimé${gender === 'f' ? 'e' : ''}`);
  }

  /**
   * Confirmation d'enregistrement.
   * @param entity - Nom de l'entite, capitalise.
   * @param mode  - Creation ou modification.
   * @param gender - Genre, pour accorder le participe. Masculin par defaut.
   */
  saved(entity: string, mode: SaveMode, gender: EntityGender = 'm'): void {
    const suffix = gender === 'f' ? 'e' : '';
    this.success(
      mode === 'create' ? `${entity} créé${suffix}` : `${entity} mis${suffix} à jour`,
    );
  }
}
