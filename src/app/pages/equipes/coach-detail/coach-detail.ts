import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CoachingStaffService } from '../../../shared/services/coaching-staff.service';
import { CoachingStaffMember } from '../../../shared/models';
import { SeoService } from '../../../shared/services/seo.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../../shared/components/layout/breadcrumb.component';

@Component({
  selector: 'app-coach-detail',
  standalone: true,
  imports: [BreadcrumbComponent],
  templateUrl: './coach-detail.html',
  styleUrls: ['./coach-detail.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoachDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly coachingStaffService = inject(CoachingStaffService);
  private readonly seoService = inject(SeoService);
  private readonly destroyRef = inject(DestroyRef);

  readonly coach = signal<CoachingStaffMember | undefined>(undefined);
  readonly loading = signal<boolean>(true);
  readonly error = signal<string | undefined>(undefined);
  readonly logoPath = 'assets/logos/logoTD.svg';

  readonly teamName = computed(() => this.coach()?.team?.name ?? '');

  readonly age = computed(() => {
    const coach = this.coach();
    if (!coach?.birthDate) return undefined;

    const birthDate = new Date(coach.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  });

  readonly socialLinks = computed(() => {
    const coach = this.coach();
    if (!coach?.socials) return [];

    return Object.entries(coach.socials)
      .filter(([, value]) => value)
      .map(([key, value]) => ({ platform: key, url: value as string }));
  });

  /**
   * Fil d'Ariane : source unique passée à la fois au composant d'affichage et
   * au JSON-LD BreadcrumbList (SeoService.getBreadcrumbListJsonLd), pour que
   * le chemin affiché ne diverge jamais de celui déclaré à Google.
   */
  readonly breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const coach = this.coach();
    if (!coach) return [];

    const teamId = this.route.snapshot.paramMap.get('teamId');
    const slug = this.route.snapshot.paramMap.get('slug') ?? coach.slug ?? String(coach.id);
    const team = coach.team;
    const teamSlug = teamId ?? team?.slug ?? '';
    const teamNameVal = team?.name ?? '';

    return [
      { name: 'Accueil', url: '/' },
      { name: 'Équipes', url: '/structure/equipes' },
      { name: teamNameVal, url: `/structure/equipes/${teamSlug}` },
      { name: coach.name, url: `/structure/equipes/${teamSlug}/coach/${slug}` },
    ];
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    const teamId = this.route.snapshot.paramMap.get('teamId');
    if (slug) {
      this.loadCoach(slug, teamId);
    } else {
      this.goBack();
    }
  }

  private loadCoach(slug: string, teamId: string | null): void {
    this.loading.set(true);
    this.error.set(undefined);

    this.coachingStaffService.findBySlug(slug).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (coach) => {
        this.coach.set(coach);
        this.loading.set(false);

        const team = coach.team;
        const teamSlug = teamId ?? team?.slug ?? '';
        const teamNameVal = team?.name ?? '';
        const gameName = team?.game ?? '';

        // Description : extraire le texte brut de la biographie
        const rawBio = coach.biography ?? '';
        const strippedBio = rawBio.replaceAll(/<[^>]*>/g, '').slice(0, 160);
        const description = `${coach.role} de l'équipe ${teamNameVal} (${gameName})${strippedBio ? '. ' + strippedBio : ''}`;

        this.seoService.updateMetaTags({
          title: `${coach.name} | ${coach.role} | ${teamNameVal}`,
          description,
          image: coach.image,
          url: `/structure/equipes/${teamSlug}/coach/${slug}`,
          type: 'profile',
        });

        const breadcrumb = this.seoService.getBreadcrumbListJsonLd(this.breadcrumbItems());

        const person = this.seoService.getPersonJsonLd(
          { name: coach.name, role: coach.role, image: coach.image },
          { name: teamNameVal, game: gameName },
        );

        this.seoService.setJsonLd([breadcrumb, person]);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Coach introuvable');
        this.seoService.updateMetaTags({
          title: 'Coach introuvable',
          description: "Ce coach n'est plus référencé.",
          noIndex: true,
        });
      },
    });
  }

  goBack(): void {
    const teamId = this.route.snapshot.paramMap.get('teamId');
    if (teamId) {
      this.router.navigate(['/structure/equipes', teamId]);
    } else {
      this.router.navigate(['/structure/equipes']);
    }
  }

  getCustomFields(): Array<{ key: string; value: unknown }> {
    const coach = this.coach();
    if (!coach?.customFields) return [];

    return Object.entries(coach.customFields).map(([key, value]) => ({ key, value }));
  }

  formatFieldKey(key: string): string {
    return key
      .split(/(?=[A-Z])/)
      .join(' ')
      .replaceAll('_', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
