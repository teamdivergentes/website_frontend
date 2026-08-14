import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { Observable } from 'rxjs';
import { AdminConfirmService } from './admin-confirm.service';

/**
 * Contrat qu'une page de formulaire admin doit remplir pour etre protegee.
 *
 * Volontairement minimal : la page sait seule ce qui compte comme modification.
 * Un `form.dirty` suffit dans la plupart des cas, mais pas quand l'ecran porte
 * aussi une liste enfant, ou quand un champ est pre-rempli par le chargement.
 */
export interface HasUnsavedChanges {
  hasUnsavedChanges(): boolean;
}

/**
 * Empeche de quitter une page de formulaire sans avoir enregistre.
 *
 * **Pourquoi cette garde apparait avec les pages routees.** Un formulaire en
 * dialogue se ferme d'un geste explicite : on clique sur une croix, ou sur
 * Annuler. Une page se quitte d'un retour arriere du navigateur, d'un clic dans
 * la sidebar ou d'un lien du fil d'Ariane — trois gestes qui ne disent nulle
 * part qu'ils abandonnent une saisie.
 *
 * Sans cette garde, la migration dialogue -> page ferait perdre du travail, et
 * ce serait une regression que le gain d'adressabilite ne compenserait pas.
 */
export const unsavedChangesGuard: CanDeactivateFn<HasUnsavedChanges> = (
  component,
): boolean | Observable<boolean> => {
  if (!component?.hasUnsavedChanges()) return true;
  return inject(AdminConfirmService).discardChanges();
};
