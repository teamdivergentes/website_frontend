import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-teams',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1>Gestion des Equipes</h1>
      <p>Cette page sera implementee dans un prochain EPIC.</p>
    </div>
  `,
  styles: [`
    .page {
      h1 { margin: 0 0 1rem 0; color: #1e293b; }
      p { color: #64748b; }
    }
  `]
})
export class TeamsComponent {}
