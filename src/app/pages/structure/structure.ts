import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StaffService, ConfigService } from '../../shared/services';
import { SafePipe } from '../../shared/pipes';
import { SeoService } from '../../shared/services/seo.service';

/**
 * Page publique de la structure de l'association
 * Utilise les données dynamiques du StaffService
 */
@Component({
  selector: 'app-structure',
  standalone: true,
  imports: [CommonModule, SafePipe],
  templateUrl: './structure.html',
  styleUrls: ['./structure.scss']
})
export class StructureComponent implements OnInit {
  private readonly staffService = inject(StaffService);
  private readonly configService = inject(ConfigService);
  private readonly seoService = inject(SeoService);

  // Computed signals depuis les services
  readonly administration = this.staffService.admins;
  readonly headStaff = this.staffService.headstaff;
  readonly youtubeLink = this.configService.youtubeLink;

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Structure',
      description: "Decouvrez l'organisation Team Divergentes, son staff et son histoire depuis 2017.",
      url: '/structure'
    });

    // Charge les données au démarrage
    this.staffService.loadStaff().subscribe({
      error: (err) => console.error('Error loading staff:', err)
    });

    this.configService.loadConfigs().subscribe({
      error: (err) => console.error('Error loading configs:', err)
    });
  }

  scrollToVideo(): void {
    document.getElementById('video')?.scrollIntoView({ behavior: 'smooth' });
  }

  /**
   * Récupère l'URL de l'image ou un placeholder
   */
  getImageUrl(image?: string): string {
    return image || 'assets/img/structure/no_photo.png';
  }
}
