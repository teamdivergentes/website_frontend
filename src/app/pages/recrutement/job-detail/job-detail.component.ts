import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { RecruitmentService } from '../../../shared/services';
import { RecruitmentPost } from '../../../shared/models';

@Component({
  selector: 'app-job-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './job-detail.component.html',
  styleUrls: ['./job-detail.component.scss']
})
export class JobDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recruitmentService = inject(RecruitmentService);

  readonly post = signal<RecruitmentPost | null>(null);
  readonly loading = signal(true);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.router.navigate(['/structure/recrutement']);
      return;
    }

    this.recruitmentService.getPostBySlug(slug).subscribe({
      next: (post) => {
        this.post.set(post);
        this.loading.set(false);
      },
      error: () => {
        this.router.navigate(['/structure/recrutement']);
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
