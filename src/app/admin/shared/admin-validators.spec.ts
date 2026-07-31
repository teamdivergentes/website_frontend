import { FormControl } from '@angular/forms';
import { AdminValidators, VALIDATION_MESSAGES } from './admin-validators';

describe('AdminValidators.url', () => {
  const validator = AdminValidators.url();

  it('accepte une URL en https', () => {
    expect(validator(new FormControl('https://teamdivergentes.fr'))).toBeNull();
  });

  it('accepte une URL en http', () => {
    expect(validator(new FormControl('http://exemple.fr'))).toBeNull();
  });

  it('rejette une URL sans protocole', () => {
    expect(validator(new FormControl('teamdivergentes.fr'))).not.toBeNull();
  });

  it('rejette un protocole non http', () => {
    expect(validator(new FormControl('ftp://exemple.fr'))).not.toBeNull();
  });

  it('laisse passer une valeur vide — c’est le rôle de required', () => {
    expect(validator(new FormControl(''))).toBeNull();
    expect(validator(new FormControl(null))).toBeNull();
  });
});

describe('AdminValidators.discordWebhook', () => {
  const validator = AdminValidators.discordWebhook();

  it('accepte une URL de webhook Discord', () => {
    expect(
      validator(new FormControl('https://discord.com/api/webhooks/123/abc')),
    ).toBeNull();
  });

  it('rejette une URL valide qui n’est pas un webhook Discord', () => {
    expect(validator(new FormControl('https://exemple.fr'))).not.toBeNull();
  });

  it('laisse passer une valeur vide', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });
});

describe('VALIDATION_MESSAGES', () => {
  it('accorde « requis » au masculin', () => {
    expect(VALIDATION_MESSAGES.required('Le nom')).toBe('Le nom est requis');
  });

  it('accorde « requise » au féminin', () => {
    expect(VALIDATION_MESSAGES.required('La description', 'f')).toBe(
      'La description est requise',
    );
  });

  it('n’ajoute pas de ponctuation finale', () => {
    expect(VALIDATION_MESSAGES.required('Le nom').endsWith('.')).toBeFalse();
  });

  it('fournit une formulation unique pour les URL', () => {
    expect(VALIDATION_MESSAGES.url).toContain('URL');
    expect(VALIDATION_MESSAGES.url).toContain('http');
  });

  it('fournit une formulation pour l’email', () => {
    expect(VALIDATION_MESSAGES.email).toBeTruthy();
  });

  it('compose le message de longueur maximale', () => {
    expect(VALIDATION_MESSAGES.maxLength('Le nom', 100)).toContain('100');
  });

  it('compose le message de longueur minimale', () => {
    expect(VALIDATION_MESSAGES.minLength('Le mot de passe', 8)).toContain('8');
  });
});
