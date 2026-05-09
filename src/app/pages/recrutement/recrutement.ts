import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecruitmentService } from '../../shared/services';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-recrutement',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recrutement.html',
  styleUrls: ['./recrutement.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecrutementComponent implements OnInit {
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly seoService = inject(SeoService);

  readonly activePosts = this.recruitmentService.activePosts;
  readonly loading = signal(true);
  readonly error = signal<string | undefined>(undefined);

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Recrutement',
      description: "Rejoignez Team Divergentes ! Consultez nos offres de postes bénévoles dans l'esport.",
      url: '/structure/recrutement'
    });
    const breadcrumb = this.seoService.getBreadcrumbListJsonLd([
      { name: 'Accueil', url: '/' },
      { name: 'Recrutement', url: '/structure/recrutement' },
    ]);
    this.seoService.setJsonLd(breadcrumb);
    this.loadPosts();
  }

  loadPosts(): void {
    this.loading.set(true);
    this.error.set(undefined);
    this.recruitmentService.loadActivePosts().subscribe({
      next: () => {
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Erreur lors du chargement des offres de recrutement');
      }
    });
  }
}
