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

  readonly activePosts = this.recruitmentService.activePosts;

  ngOnInit(): void {
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
