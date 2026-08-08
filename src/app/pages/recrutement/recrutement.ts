import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecruitmentService } from '../../shared/services';
import { SeoService } from '../../shared/services/seo.service';
import { PageHeaderComponent } from '../../shared/components/layout/page-header.component';
import { PageComponent } from '../../shared/components/layout/page.component';

@Component({
  selector: 'app-recrutement',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, PageComponent],
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

  /**
   * Meta tags du listing. Rejouée une fois les offres chargées : le visuel de
   * la première annonce sert de carte de partage, ce qui suit les campagnes de
   * recrutement sans repasser par le code.
   */
  private updateSeo(): void {
    const firstPost = this.activePosts()[0];

    this.seoService.updateMetaTags({
      title: 'Recrutement',
      description: "Rejoignez Team Divergentes ! Consultez nos offres de postes bénévoles dans l'esport.",
      image: firstPost?.image,
      imageAlt: firstPost?.image ? firstPost.title : undefined,
      url: '/structure/recrutement'
    });
  }

  ngOnInit(): void {
    this.updateSeo();
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
        this.updateSeo();
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Erreur lors du chargement des offres de recrutement');
      }
    });
  }
}
