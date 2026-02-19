import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecruitmentService } from '../../shared/services';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-recrutement',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recrutement.html',
  styleUrls: ['./recrutement.scss']
})
export class RecrutementComponent implements OnInit {
  private readonly recruitmentService = inject(RecruitmentService);
  private readonly seoService = inject(SeoService);

  readonly activePosts = this.recruitmentService.activePosts;

  ngOnInit(): void {
    this.seoService.updateMetaTags({
      title: 'Recrutement',
      description: "Rejoignez Team Divergentes ! Consultez nos offres de postes bénévoles dans l'esport.",
      url: '/structure/recrutement'
    });
    this.loadPosts();
  }

  loadPosts(): void {
    this.recruitmentService.loadActivePosts().subscribe({
      error: (err) => {
        console.error('Erreur lors du chargement des offres:', err);
      }
    });
  }
}
