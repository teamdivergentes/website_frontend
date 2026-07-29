import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Genre grammatical du libelle, pour accorder "requis" / "requise". */
export type LabelGender = 'm' | 'f';

/**
 * Motif d'URL accepte par l'administration.
 *
 * Etait reecrit a trois endroits : `config-page` (6 champs),
 * `coaching-staff-dialog`, et absent la ou il aurait du etre
 * (`team-member-form`, `sponsor-links`, qui n'avaient que `required`).
 */
export const ADMIN_URL_PATTERN = /^https?:\/\/.+/;

/** Motif d'URL de webhook Discord. Etait duplique deux fois dans le meme fichier. */
export const DISCORD_WEBHOOK_PATTERN = /^https:\/\/discord\.com\/api\/webhooks\/.+/;

/**
 * Validateurs partages du panel d'administration.
 *
 * Tous laissent passer une valeur vide : signaler l'absence est le role de
 * `Validators.required`, et cumuler les deux produirait deux messages pour un
 * seul champ vide.
 */
export const AdminValidators = {
  url(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: unknown = control.value;
      if (!value) return null;
      return ADMIN_URL_PATTERN.test(String(value)) ? null : { adminUrl: true };
    };
  },

  discordWebhook(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value: unknown = control.value;
      if (!value) return null;
      return DISCORD_WEBHOOK_PATTERN.test(String(value)) ? null : { discordWebhook: true };
    };
  },
};

/**
 * Formulations uniques des messages de validation.
 *
 * L'audit du 2026-07-29 a releve **18 formulations differentes** pour
 * "champ obligatoire", melangeant trois registres : "X est requis(e)" (11 fois),
 * "X est obligatoire" (3 fois), "X requis" sans article (4 fois), et un
 * imperatif "Veuillez selectionner...".
 *
 * Les URL avaient deux messages pour **le meme motif** : "URL invalide" (6 fois)
 * et "URL invalide (doit commencer par http:// ou https://)" (6 fois).
 *
 * Aucun message ne porte de ponctuation finale.
 */
export const VALIDATION_MESSAGES = {
  /**
   * @param label - Libelle du champ avec son article (ex. "Le nom", "La description").
   * @param gender - Genre du libelle, pour accorder le participe.
   */
  required: (label: string, gender: LabelGender = 'm'): string =>
    `${label} est requis${gender === 'f' ? 'e' : ''}`,

  url: 'URL invalide (doit commencer par http:// ou https://)',
  discordWebhook: 'URL de webhook Discord invalide',
  email: 'Email invalide',

  maxLength: (label: string, max: number): string =>
    `${label} ne doit pas dépasser ${max} caractères`,

  minLength: (label: string, min: number): string => `${label} doit faire au moins ${min} caractères`,
} as const;
