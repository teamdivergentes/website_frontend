import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecruitmentService } from '../../../shared/services';
import { RecruitmentPost } from '../../../shared/models';
import { SeoService } from '../../../shared/services/seo.service';
import { PageHeaderComponent } from '../../../shared/components/layout/page-header.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/layout/breadcrumb.component';
import { PageComponent } from '../../../shared/components/layout/page.component';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [RouterLink, PageHeaderComponent, BreadcrumbComponent, PageComponent],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JobDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly post = signal<RecruitmentPost | null>(null);
  readonly loading = signal(true);

  /**
   * Source unique du fil d'Ariane : le meme tableau alimente le composant
   * visuel <dvg-breadcrumb> et SeoService.getBreadcrumbListJsonLd, afin que
   * le chemin affiche ne puisse jamais diverger du chemin declare a Google.
   * Quand l'offre est introuvable, le chemin s'arrete au niveau parent
   * (Accueil › Recrutement) puisque le titre du poste n'est pas connu.
   */
  readonly breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const post = this.post();
    if (!post) {
      return [
        { name: 'Accueil', url: '/' },
        { name: 'Recrutement', url: '/structure/recrutement' },
      ];
    }
    return [
      { name: 'Accueil', url: '/' },
      { name: 'Recrutement', url: '/structure/recrutement' },
      { name: post.title, url: `/structure/recrutement/${post.slug}` },
    ];
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.router.navigate(['/structure/recrutement']);
      return;
    }

    this.recruitmentService.getPostBySlug(slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (post) => {
        this.post.set(post);
        this.loading.set(false);
        this.seoService.updateMetaTags({
          title: post.title,
          // Le descriptif du poste est déjà rédigé et déjà exploité par le
          // JSON-LD `JobPosting` juste en dessous. La carte de partage
          // reprenait pourtant une phrase générique : deux offres différentes
          // partageaient donc la même description.
          description: this.seoService.buildDescription(
            post.description,
            `Poste bénévole : ${post.title}. Rejoignez Team Divergentes !`
          ),
          image: post.image,
          imageAlt: post.image ? post.title : undefined,
          url: `/structure/recrutement/${post.slug}`
        });
        const breadcrumb = this.seoService.getBreadcrumbListJsonLd(this.breadcrumbItems());
        const jobPosting = this.seoService.getJobPostingJsonLd({
          title: post.title,
          description: post.description,
          createdAt: post.createdAt ?? new Date().toISOString(),
          slug: post.slug ?? slug,
        });
        this.seoService.setJsonLd([breadcrumb, jobPosting]);
      },
      error: () => {
        this.loading.set(false);
        this.seoService.updateMetaTags({
          title: 'Poste introuvable',
          description: "Cette offre de recrutement n'est plus disponible.",
          noIndex: true,
        });
      }
    });
  }

  /**
   * Split a newline-separated string into non-empty lines
   */
  splitLines(text: string | undefined): string[] {
    if (!text) return [];
    return text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  }

  getApplyQueryParams(): Record<string, string> {
    const p = this.post();
    if (!p) return {};
    return { postTitle: p.title, postType: p.type };
  }
}
