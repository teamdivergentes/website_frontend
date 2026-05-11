import { Component, OnInit, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RecruitmentService } from '../../../shared/services';
import { RecruitmentPost } from '../../../shared/models';
import { SeoService } from '../../../shared/services/seo.service';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [RouterLink],
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
          description: `Poste bénévole : ${post.title}. Rejoignez Team Divergentes !`,
          url: `/structure/recrutement/${post.slug}`
        });
        const breadcrumb = this.seoService.getBreadcrumbListJsonLd([
          { name: 'Accueil', url: '/' },
          { name: 'Recrutement', url: '/structure/recrutement' },
          { name: post.title, url: `/structure/recrutement/${post.slug}` },
        ]);
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
