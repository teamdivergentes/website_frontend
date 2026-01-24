import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1>Configuration</h1>
      <p>Cette page sera implementee dans un prochain EPIC.</p>
    </div>
  `,
  styles: [`
    .page {
      h1 { margin: 0 0 1rem 0; color: var(--white); }
      p { color: var(--gray); }
    }
  `]
})
export class ConfigComponent {}
