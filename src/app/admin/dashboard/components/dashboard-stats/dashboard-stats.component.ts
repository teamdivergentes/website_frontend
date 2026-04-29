import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

/**
 * Carte d'accueil avec liens rapides vers les sections admin.
 * Reçoit userName et userRole en @Input depuis le parent.
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
  readonly userName = input.required<string>();
  readonly userRole = input.required<string>();
}
