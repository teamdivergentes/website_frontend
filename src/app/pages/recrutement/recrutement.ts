import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RecruitmentService } from '../../shared/services';

@Component({
  selector: 'app-recrutement',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recrutement.html',
  styleUrls: ['./recrutement.scss']
})
export class RecrutementComponent implements OnInit {
  private readonly recruitmentService = inject(RecruitmentService);

  // Computed signal pour les offres actives
  readonly activePosts = this.recruitmentService.activePosts;

  ngOnInit(): void {
    this.loadPosts();
  }

  /**
   * Charge les offres actives depuis l'API
   */
  loadPosts(): void {
    this.recruitmentService.loadActivePosts().subscribe({
      error: (err) => {
        console.error('Erreur lors du chargement des offres:', err);
      }
    });
  }
}
