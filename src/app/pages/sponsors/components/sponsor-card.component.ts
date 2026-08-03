import { Component, Input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Sponsor } from '../../../shared/models';

/**
 * Composant d'affichage d'un sponsor selon le design Figma
 * - Image principale (logo) dans une carte centrale avec bordure verte
 * - 2 images secondaires positionnées autour selon le layout choisi
 * - Description à droite avec le nom du sponsor et lien
 */
@Component({
  selector: 'app-sponsor-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="sponsor-section" [class]="'layout-' + sponsor.imageLayout">
      <!-- Zone des images (gauche) -->
      <div class="images-container">
        <!-- Image secondaire position 1 -->
        @if (secondaryImage1()) {
          <img
            [src]="secondaryImage1()!.url"
            [alt]="secondaryImage1()!.alt || sponsor.name"
            class="secondary-image secondary-1"
            loading="lazy" />
        }

        <!-- Carte principale avec le logo -->
        <div class="main-card">
          @if (primaryImage()) {
            <img
              [src]="primaryImage()!.url"
              [alt]="sponsor.name + ' logo'"
              class="main-logo"
              loading="lazy" />
          } @else {
            <div class="no-logo">
              <span>{{ sponsor.name }}</span>
            </div>
          }
        </div>

        <!-- Image secondaire position 2 -->
        @if (secondaryImage2()) {
          <img
            [src]="secondaryImage2()!.url"
            [alt]="secondaryImage2()!.alt || sponsor.name"
            class="secondary-image secondary-2"
            loading="lazy" />
        }
      </div>

      <!-- Zone du contenu (droite) -->
      <div class="content-container">
        <span class="sponsor-name">{{ sponsor.name }}</span>
        @if (sponsor.description) {
          <p class="sponsor-description">{{ sponsor.description }}</p>
        }

        <!-- Lien principal -->
        @if (primaryLink()) {
          <a
            [href]="primaryLink()!.url"
            target="_blank"
            rel="noopener sponsored"
            class="sponsor-link"
            [title]="'Visiter ' + sponsor.name">
            <mat-icon>arrow_outward</mat-icon>
          </a>
        }
      </div>
    </article>
  `,
  styles: [`
    :host {
      display: block;
      --primary: #32D299;
      /* --border n'est pas promu globalement : vaut $dark-green ici, cf. rapport de migration. */
      --border: #28413b;
      --muted: rgba(255, 255, 255, 0.72);
    }

    .sponsor-section {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: clamp(2rem, 4vw, 4rem);
      padding: clamp(2rem, 4vw, 4rem) 0;
      border-bottom: 1px solid var(--border);

      @media (max-width: 900px) {
        grid-template-columns: 1fr;
        gap: var(--space-xl);
      }
    }

    /* Zone des images */
    .images-container {
      position: relative;
      width: clamp(300px, 40vw, 420px);
      height: clamp(350px, 45vw, 500px);

      @media (max-width: 900px) {
        width: 100%;
        max-width: 100%;
        height: clamp(300px, 85vw, 400px);
        margin: 0 auto;
      }
    }

    /* Carte principale */
    .main-card {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: clamp(200px, 25vw, 350px);
      aspect-ratio: 1;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 35px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-xl);
      z-index: 2;

      @media (max-width: 900px) {
        width: clamp(220px, 65vw, 300px);
      }
    }

    .main-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
      aspect-ratio: 1;
    }

    .no-logo {
      color: var(--muted);
      font-size: 1.5rem;
      text-align: center;
    }

    /* Images secondaires */
    .secondary-image {
      position: absolute;
      border-radius: 20px;
      object-fit: cover;
      aspect-ratio: 1;
      z-index: 3;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    /* Layout 1: Secondaire 1 bas-gauche, Secondaire 2 haut-droite */
    .layout-LAYOUT_1 {
      .secondary-1 {
        bottom: 0;
        left: 0;
        width: clamp(100px, 12vw, 150px);
        height: clamp(100px, 12vw, 150px);
      }

      .secondary-2 {
        top: 0;
        right: 0;
        width: clamp(90px, 10vw, 130px);
        height: clamp(90px, 10vw, 130px);
      }
    }

    /* Layout 2: Secondaire 1 haut-gauche, Secondaire 2 bas-droite */
    .layout-LAYOUT_2 {
      .secondary-1 {
        top: 0;
        left: 0;
        width: clamp(80px, 9vw, 100px);
        height: clamp(80px, 9vw, 100px);
      }

      .secondary-2 {
        bottom: 0;
        right: 0;
        width: clamp(100px, 12vw, 150px);
        height: clamp(100px, 12vw, 150px);
      }
    }

    /* Layout 3: Secondaire 1 haut-droite, Secondaire 2 bas-gauche */
    .layout-LAYOUT_3 {
      .secondary-1 {
        top: 0;
        right: 0;
        width: clamp(90px, 10vw, 130px);
        height: clamp(90px, 10vw, 130px);
      }

      .secondary-2 {
        bottom: 0;
        left: 0;
        width: clamp(100px, 12vw, 150px);
        height: clamp(100px, 12vw, 150px);
      }
    }

    /* Zone du contenu */
    .content-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding-right: clamp(var(--space-md), 3vw, var(--space-2xl)); /* 3rem/48px -> space-2xl */

      @media (max-width: 900px) {
        text-align: center;
        padding: 0 var(--space-md);
      }
    }

    .sponsor-name {
      display: block;
      font-family: var(--font-display);
      font-size: clamp(1rem, 1.5vw, 1.4rem);
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: var(--primary);
      margin-bottom: var(--space-xs);
    }

    .sponsor-description {
      font-family: var(--font-body);
      font-size: clamp(0.875rem, 1.2vw, 1.125rem);
      line-height: 1.8;
      color: var(--text);
      margin: 0;
      max-width: 700px;

      @media (max-width: 900px) {
        text-align: center;
      }
    }

    .sponsor-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 39px;
      height: 39px;
      margin-top: var(--space-lg);
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--primary);
      text-decoration: none;
      transition: all 0.3s ease;

      @media (max-width: 900px) {
        margin: var(--space-lg) auto 0;
      }

      &:hover {
        background: var(--primary);
        border-color: var(--primary);
        color: var(--card-bg);
      }

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }
  `]
})
export class SponsorCardComponent {
  @Input({ required: true }) sponsor!: Sponsor;

  // Image principale (isPrimary = true ou position 0)
  readonly primaryImage = computed(() => {
    const images = this.sponsor.images;
    const sorted = [...images].sort((a, b) => a.position - b.position);
    return sorted.find(i => i.isPrimary) || sorted[0] || null;
  });

  // Image secondaire 1 (position 1 ou première non-principale)
  readonly secondaryImage1 = computed(() => {
    const images = this.sponsor.images;
    const sorted = [...images].sort((a, b) => a.position - b.position);
    const primary = this.primaryImage();
    const nonPrimary = sorted.filter(i => i.id !== primary?.id);
    return nonPrimary[0] || null;
  });

  // Image secondaire 2 (position 2 ou deuxième non-principale)
  readonly secondaryImage2 = computed(() => {
    const images = this.sponsor.images;
    const sorted = [...images].sort((a, b) => a.position - b.position);
    const primary = this.primaryImage();
    const secondary1 = this.secondaryImage1();
    const remaining = sorted.filter(i => i.id !== primary?.id && i.id !== secondary1?.id);
    return remaining[0] || null;
  });

  // Lien principal
  readonly primaryLink = computed(() => {
    const links = this.sponsor.links;
    return links.find(l => l.isPrimary) || links[0] || null;
  });
}
