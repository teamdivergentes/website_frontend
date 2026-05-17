import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AdminShortcutsService } from '../../../../../shared/services/admin-shortcuts.service';
import { AdminShortcut } from '../../../../../shared/config/admin-shortcuts';

/**
 * Carte d'accueil avec liens rapides vers les sections admin.
 * Reçoit userName et userRole en @Input depuis le parent.
 *
 * Les quick-links sont générés dynamiquement depuis AdminShortcutsService :
 * seuls les raccourcis pour lesquels l'utilisateur possède les permissions
 * requises sont affichés. Le dashboard (/admin) est exclu des quick-links
 * car l'utilisateur est déjà sur cette page.
 */
@Component({
  selector: 'app-dashboard-stats',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-stats.component.html',
  styleUrl: './dashboard-stats.component.scss'
})
export class DashboardStatsComponent {
  private readonly shortcutsService = inject(AdminShortcutsService);

  readonly userName = input.required<string>();
  readonly userRole = input.required<string>();

  /**
   * Raccourcis disponibles pour l'utilisateur courant, hors dashboard.
   * Signal réactif : se met à jour automatiquement si les permissions changent.
   */
  readonly quickLinks = computed<AdminShortcut[]>(() =>
    this.shortcutsService.availableShortcuts().filter(s => s.key !== 'dashboard')
  );
}
