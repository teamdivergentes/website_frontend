import { computed, inject, Injectable, Signal } from '@angular/core';
import { AuthService } from './api/auth.service';
import { ADMIN_SHORTCUTS, AdminShortcut, AdminShortcutSection } from '../config/admin-shortcuts';

/**
 * Service centralisé de gestion des raccourcis admin perms-aware.
 *
 * Basé sur les Signals Angular (zoneless). Toutes les méthodes publiques
 * sont réactives : elles se mettent à jour automatiquement quand les
 * permissions de l'utilisateur changent (login / logout / refresh).
 */
@Injectable({ providedIn: 'root' })
export class AdminShortcutsService {
  private readonly authService = inject(AuthService);

  /**
   * Signal calculé : liste des raccourcis visibles pour l'utilisateur courant.
   * Filtre selon `requiredPermissions` (mode AND).
   * Retourne un tableau vide si l'utilisateur n'est pas authentifié.
   */
  readonly availableShortcuts: Signal<AdminShortcut[]> = computed(() => {
    if (!this.authService.isAuthenticated()) {
      return [];
    }
    const perms = this.authService.permissions();
    return ADMIN_SHORTCUTS.filter(shortcut => this.hasAllPermissions(perms, shortcut.requiredPermissions));
  });

  /**
   * Signal calculé : raccourcis regroupés par section.
   * Les raccourcis sans section (ex. dashboard) sont regroupés sous la clé `undefined`.
   */
  readonly shortcutsBySection: Signal<Map<AdminShortcutSection | undefined, AdminShortcut[]>> = computed(() => {
    const map = new Map<AdminShortcutSection | undefined, AdminShortcut[]>();
    for (const shortcut of this.availableShortcuts()) {
      const key = shortcut.section;
      const group = map.get(key) ?? [];
      group.push(shortcut);
      map.set(key, group);
    }
    return map;
  });

  /**
   * Vérifie si un raccourci identifié par sa `key` est disponible
   * pour l'utilisateur courant.
   *
   * @param key - Clé kebab-case du raccourci (ex. "users", "twitch-channels").
   * @returns `true` si le raccourci existe dans le registre ET que l'utilisateur
   *          possède toutes les permissions requises.
   */
  canShortcut(key: string): boolean {
    return this.availableShortcuts().some(s => s.key === key);
  }

  // ─── Helpers internes ─────────────────────────────────────────────────────

  private hasAllPermissions(userPerms: string[], required: string[]): boolean {
    if (required.length === 0) return true;
    return required.every(p => userPerms.includes(p));
  }
}
