import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RecruitmentService } from '../../shared/services';

@Component({
  selector: 'app-application-form',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './application-form.component.html',
  styleUrls: ['./application-form.component.scss']
})
export class ApplicationFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly recruitmentService = inject(RecruitmentService);

  postTitle = '';
  postType = '';

  name = '';
  email = '';
  message = '';
  cvFile: File | null = null;
  cvFileName = '';
  cvTouched = false;

  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.postTitle = params['postTitle'] || '';
      this.postType = params['postType'] || '';

      // Si pas de titre, rediriger vers la page recrutement
      if (!this.postTitle) {
        this.router.navigate(['/structure/recrutement']);
      }
    });
  }

  /**
   * Gestion de la sélection de fichier
   */
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.cvFile = input.files[0];
      this.cvFileName = this.cvFile.name;
      this.cvTouched = false;
    }
  }

  /**
   * Soumission du formulaire
   */
  onSubmit(): void {
    if (this.isSubmitting()) return;

    if (!this.cvFile) {
      this.cvTouched = true;
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    const formData = new FormData();
    formData.append('name', this.name);
    formData.append('email', this.email);
    if (this.message) {
      formData.append('message', this.message);
    }
    formData.append('postTitle', this.postTitle);
    formData.append('postType', this.postType);
    if (this.cvFile) {
      formData.append('cv', this.cvFile);
    }

    this.recruitmentService.applyToPost(formData).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        if (response.success) {
          this.submitSuccess.set(true);
          // Reset du formulaire
          this.name = '';
          this.email = '';
          this.message = '';
          this.cvFile = null;
          this.cvFileName = '';
        } else {
          this.submitError.set(response.message);
        }
      },
      error: () => {
        this.isSubmitting.set(false);
        this.submitError.set("Erreur lors de l'envoi. Veuillez réessayer.");
      }
    });
  }

  /**
   * Retour à la page recrutement
   */
  goBack(): void {
    this.router.navigate(['/structure/recrutement']);
  }
}
