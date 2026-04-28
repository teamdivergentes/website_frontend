import { ChangeDetectionStrategy, Component, OnInit, effect, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Section "État du site" du dashboard admin.
 * Affiche la date/heure actuelle (mise à jour toutes les minutes), la version et le statut en ligne.
 */
@Component({
  selector: 'app-dashboard-recent',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-recent.component.html',
  styleUrl: './dashboard-recent.component.scss'
})
export class DashboardRecentComponent implements OnInit {
  readonly currentDateTime = signal(this.formatDateTime());

  constructor() {
    // Mise à jour de l'horloge toutes les minutes
    effect((onCleanup) => {
      const interval = setInterval(() => {
        this.currentDateTime.set(this.formatDateTime());
      }, 60000);

      onCleanup(() => clearInterval(interval));
    });
  }

  ngOnInit(): void {
    // Forcer une première mise à jour pour s'assurer que le signal est à jour
    this.currentDateTime.set(this.formatDateTime());
  }

  private formatDateTime(): string {
    const now = new Date();
    const date = now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const time = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${date} • ${time}`;
  }
}
